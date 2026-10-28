import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import "./styles/order.scss";

type OrderFields = {
  messageDescription: string;
  albumCount: string;
  albumType: string;
  albumDescription: string;
  contact: string;
};

const initialFields: OrderFields = {
  messageDescription: "",
  albumCount: "1",
  albumType: "",
  albumDescription: "",
  contact: "",
};

function hasUnsupportedControlCharacters(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint !== undefined &&
      (codePoint <= 0x08 ||
        (codePoint >= 0x0b && codePoint <= 0x0c) ||
        (codePoint >= 0x0e && codePoint <= 0x1f) ||
        codePoint === 0x7f)
    ) {
      return true;
    }
  }
  return false;
}

const safeDescription = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, label)
    .max(maxLength, `Максимум ${maxLength} символов`)
    .refine(
      (value) => !hasUnsupportedControlCharacters(value),
      "Удалите недопустимые управляющие символы",
    );

function isValidContact(value: string) {
  const compactPhone = value.replace(/[()\s-]/g, "");
  const telegramUsername = value.startsWith("@") ? value.slice(1) : value;

  return (
    /^\+?\d{7,15}$/.test(compactPhone) ||
    z.email().safeParse(value).success ||
    /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(telegramUsername)
  );
}

const orderSchema = z.object({
  messageDescription: safeDescription("Напишите сообщение", 2000),
  albumCount: z
    .string()
    .trim()
    .regex(/^\d+$/, "Введите целое число")
    .transform(Number)
    .pipe(z.number().int().min(1, "Минимум 1 альбом").max(500, "Максимум 500 альбомов")),
  albumType: safeDescription("Укажите тему фотоальбома", 100),
  albumDescription: safeDescription("Опишите пожелания к фотоальбому", 4000),
  contact: safeDescription("Укажите телефон, email или Telegram", 254).refine(
    isValidContact,
    "Введите телефон, email или Telegram-имя (например, @username)",
  ),
  website: z.literal("").default(""),
}).strict();

type OrderField = keyof OrderFields;
type FieldErrors = Partial<Record<OrderField, string>>;

function isOrderField(value: PropertyKey | undefined): value is OrderField {
  return typeof value === "string" && Object.hasOwn(initialFields, value);
}

export default function Order() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const completedFields = Object.values(fields).filter((value) => value.trim().length > 0).length;
  const progressLabel = `${String(completedFields).padStart(2, "0")} / 05`;

  const updateField = (field: OrderField, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus(null);
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const parsed = orderSchema.safeParse(fields);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (isOrderField(field) && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSending(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result: {
        message?: string;
        error?: string;
        fieldErrors?: Record<string, string[] | undefined>;
      } = await response.json();

      if (!response.ok) {
        if (result.fieldErrors) {
          const serverErrors: FieldErrors = {};
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (isOrderField(field) && messages?.[0]) {
              serverErrors[field] = messages[0];
            }
          }
          setErrors(serverErrors);
        }
        throw new Error(result.error ?? "Не удалось отправить заказ.");
      }

      setStatus({ type: "success", text: result.message ?? "Заказ успешно отправлен." });
      setFields(initialFields);
    } catch (error) {
      setStatus({
        type: "error",
        text: error instanceof Error
          ? error.message
          : "Не удалось связаться с сервером. Попробуйте ещё раз.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="photo-order" aria-labelledby="photo-order-title">
      <div className="photo-order__glow photo-order__glow--one" aria-hidden="true" />
      <div className="photo-order__glow photo-order__glow--two" aria-hidden="true" />

      <div className="photo-order__intro">
        <span className="photo-order__eyebrow">
          <span className="photo-order__eyebrow-dot" />
          Печатаем фотоальбомы из ваших готовых фотографий
        </span>
        <h1 id="photo-order-title" className="photo-order__title">
          Заказать <span>альбом</span>
        </h1>
        <p className="photo-order__description">
          Опишите идею фотоальбома и оставьте контакт. Мы согласуем параметры,
          наполнение, стоимость и сроки до печати.
        </p>
        <button
          className="photo-order__button"
          type="button"
          aria-expanded={isFormOpen}
          aria-controls="photo-order-form"
          onClick={() => {
            setIsFormOpen((open) => !open);
            setStatus(null);
            setErrors({});
          }}
        >
          {isFormOpen ? "Скрыть форму" : "Заказать фотоальбом"}
          <span className="photo-order__button-arrow" aria-hidden="true">
            {isFormOpen ? "−" : "↗"}
          </span>
        </button>
      </div>

      <aside className="photo-order__contacts" aria-label="Контакты">
        <span className="photo-order__contacts-label">Можно написать напрямую</span>
        <a href="tel:+79994311958">
          <span className="photo-order__contact-icon" aria-hidden="true">↗</span>
          +7 999 431-19-58
        </a>
        <a href="mailto:t64117837@gmail.com">
          <span className="photo-order__contact-icon" aria-hidden="true">✉</span>
          t64117837@gmail.com
        </a>
        <a href="https://t.me/m1hail_true" target="_blank" rel="noreferrer">
          <span className="photo-order__contact-icon" aria-hidden="true">↗</span>
          @m1hail_true
        </a>
        <span className="photo-order__contact-caption">Без спешки. С вниманием к деталям.</span>
      </aside>

      <div
        className={`photo-order__form-panel${isFormOpen ? " photo-order__form-panel--open" : ""}`}
        aria-hidden={!isFormOpen}
        inert={!isFormOpen}
      >
        <form
          id="photo-order-form"
          className="photo-order__form"
          onSubmit={submitOrder}
          noValidate
        >
          <input
            className="photo-order__honeypot"
            type="text"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            value=""
            readOnly
          />
          <div className="photo-order__form-heading">
            <div>
              <span className="photo-order__eyebrow">Несколько деталей</span>
              <h2>Расскажите о заказе</h2>
            </div>
            <span
              className="photo-order__step"
              aria-label={`Заполнено полей: ${completedFields} из 5`}
              aria-live="polite"
            >
              {progressLabel}
            </span>
          </div>

          <label className="photo-order__field">
            <span><b>01</b> Описание сообщения</span>
            <textarea
              name="messageDescription"
              placeholder="Например: хочу узнать стоимость и свободные даты..."
              value={fields.messageDescription}
              onChange={(event) => updateField("messageDescription", event.target.value)}
              maxLength={2000}
              aria-invalid={Boolean(errors.messageDescription)}
              aria-describedby={errors.messageDescription ? "message-description-error" : undefined}
              required
              rows={3}
            />
            {errors.messageDescription && (
              <span className="photo-order__field-error" id="message-description-error" role="alert">
                {errors.messageDescription}
              </span>
            )}
          </label>

          <div className="photo-order__form-row">
            <label className="photo-order__field">
              <span><b>02</b> Количество фотоальбомов</span>
              <input
                name="albumCount"
                type="number"
                min="1"
                max="500"
                value={fields.albumCount}
                onChange={(event) => updateField("albumCount", event.target.value)}
                aria-invalid={Boolean(errors.albumCount)}
                aria-describedby={errors.albumCount ? "album-count-error" : undefined}
                required
              />
              {errors.albumCount && (
                <span className="photo-order__field-error" id="album-count-error" role="alert">
                  {errors.albumCount}
                </span>
              )}
            </label>

            <label className="photo-order__field">
              <span><b>03</b> Тема фотоальбома</span>
              <input
                name="albumType"
                type="text"
                placeholder="Семья, путешествие, событие..."
                value={fields.albumType}
                onChange={(event) => updateField("albumType", event.target.value)}
                maxLength={100}
                aria-invalid={Boolean(errors.albumType)}
                aria-describedby={errors.albumType ? "album-type-error" : undefined}
                required
              />
              {errors.albumType && (
                <span className="photo-order__field-error" id="album-type-error" role="alert">
                  {errors.albumType}
                </span>
              )}
            </label>
          </div>

          <label className="photo-order__field">
            <span><b>04</b> Пожелания к фотоальбому</span>
            <textarea
              name="albumDescription"
              placeholder="Опишите желаемый размер, оформление и другие детали. Готовые фотографии передадите отдельно."
              value={fields.albumDescription}
              onChange={(event) => updateField("albumDescription", event.target.value)}
              maxLength={4000}
              aria-invalid={Boolean(errors.albumDescription)}
              aria-describedby={errors.albumDescription ? "album-description-error" : undefined}
              required
              rows={4}
            />
            {errors.albumDescription && (
              <span className="photo-order__field-error" id="album-description-error" role="alert">
                {errors.albumDescription}
              </span>
            )}
          </label>

          <label className="photo-order__field">
            <span><b>05</b> Как с вами связаться?</span>
            <input
              name="contact"
              type="text"
              placeholder="Телефон, email или @username в Telegram"
              autoComplete="off"
              value={fields.contact}
              onChange={(event) => updateField("contact", event.target.value)}
              maxLength={254}
              aria-invalid={Boolean(errors.contact)}
              aria-describedby={errors.contact ? "contact-error" : undefined}
              required
            />
            {errors.contact && (
              <span className="photo-order__field-error" id="contact-error" role="alert">
                {errors.contact}
              </span>
            )}
          </label>

          <div className="photo-order__form-footer">
            <p>
              Отправляя заявку, вы просите связаться с вами.{" "}
              <Link to="/privacy">Как используются данные</Link>.
            </p>
            <button className="photo-order__submit" type="submit" disabled={isSending}>
              {isSending ? "Отправляем..." : "Отправить заявку"}
              {!isSending && <span aria-hidden="true">↗</span>}
            </button>
          </div>
          {status && (
            <p className={`photo-order__status photo-order__status--${status.type}`} role="status">
              {status.text}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
