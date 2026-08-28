import { describe, it, expect, vi, beforeEach } from "vitest";

const { sendMock, resendSendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(async () => ({})),
  resendSendMock: vi.fn(async () => ({ data: { id: "re_1" }, error: null })),
}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: sendMock })),
  },
}));
vi.mock("resend", () => ({
  Resend: class {
    constructor() {
      this.emails = { send: resendSendMock };
    }
  },
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

beforeEach(() => {
  vi.clearAllMocks();
});

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

  it("returns a form-level error when the support notification throws", async () => {
    sendMock.mockRejectedValueOnce(new Error("smtp down"));

    const result = await sendContactEmail(null, formData(validFields));

    expect(result).toEqual({
      errors: { _form: ["メール送信に失敗しました。しばらく経ってから再度お試しください。"] },
    });
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it("sends a noreply confirmation to the submitter with support@ as the reply target", async () => {
    await sendContactEmail(null, formData(validFields));

    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "JaoRium <noreply@jaorium.com>",
        to: "yamada@example.com",
        replyTo: "support@jaorium.com",
        subject: "お問い合わせを受け付けました",
        headers: { "Auto-Submitted": "auto-replied", Precedence: "bulk" },
      }),
    );
  });

  it("escapes user input before embedding it in the email bodies", async () => {
    await sendContactEmail(
      null,
      formData({ ...validFields, name: "<script>alert(1)</script>" }),
    );

    expect(sendMock.mock.calls[0][0].html).not.toContain("<script>");
    expect(resendSendMock.mock.calls[0][0].html).not.toContain("<script>");
    expect(resendSendMock.mock.calls[0][0].html).toContain("&lt;script&gt;");
  });

  it("still succeeds when the confirmation email fails", async () => {
    resendSendMock.mockResolvedValueOnce({ data: null, error: { message: "domain not verified" } });

    const result = await sendContactEmail(null, formData(validFields));

    expect(result).toEqual({ success: true });
  });

  it("still succeeds when the confirmation email throws", async () => {
    resendSendMock.mockRejectedValueOnce(new Error("resend down"));

    const result = await sendContactEmail(null, formData(validFields));

    expect(result).toEqual({ success: true });
  });
});
