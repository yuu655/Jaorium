import { describe, it, expect, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(async () => ({})) }));
vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    this.emails = { send: sendMock };
  }),
}));

import { sendContactEmail } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

const validFields = {
  name: "山田太郎",
  email: "yamada@example.com",
  email_re: "yamada@example.com",
  message: "これはテストのお問い合わせ内容です。",
};

describe("sendContactEmail server action", () => {
  it("sends the email and returns success for valid input", async () => {
    const result = await sendContactEmail(null, formData(validFields));

    expect(result).toEqual({ success: true });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: "yamada@example.com", subject: "お問い合わせ: 山田太郎" }),
    );
  });

  it("rejects when the two email fields don't match", async () => {
    const result = await sendContactEmail(
      null,
      formData({ ...validFields, email_re: "different@example.com" }),
    );

    expect(result).toEqual({ errors: { email_re: ["メールアドレスが一致しません。"] } });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address via zod", async () => {
    const result = await sendContactEmail(
      null,
      formData({ ...validFields, email: "not-an-email", email_re: "not-an-email" }),
    );

    expect(result.errors.email).toBeTruthy();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects a message shorter than 10 characters", async () => {
    const result = await sendContactEmail(null, formData({ ...validFields, message: "short" }));

    expect(result.errors.message).toBeTruthy();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns a form-level error when Resend throws", async () => {
    sendMock.mockRejectedValueOnce(new Error("resend down"));

    const result = await sendContactEmail(null, formData(validFields));

    expect(result).toEqual({
      errors: { _form: ["メール送信に失敗しました。しばらく経ってから再度お試しください。"] },
    });
  });
});
