"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { asset, cn } from "@/lib/utils";

/**
 * The hosted static demo has no server, so there is no endpoint to post to.
 * In that build the submit is simulated locally and the success panel says so.
 */
const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

type Field = "fullName" | "phone" | "email";
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "submitting" | "success" | "error";

// Keeping field metadata together makes labels, placeholders, browser
// autocomplete, and the first-invalid-field focus behavior stay in sync.
const FIELDS: {
  name: Field;
  label: string;
  placeholder: string;
  type: string;
  autoComplete: string;
  maxLength?: number;
  inputMode?: "tel" | "email" | "text";
}[] = [
  {
    name: "fullName",
    label: "Full Name",
    placeholder: "John Doe",
    type: "text",
    autoComplete: "name",
    maxLength: 50,
  },
  {
    name: "phone",
    label: "Phone Number",
    placeholder: "0803 123 4567",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
  },
  {
    name: "email",
    label: "Email",
    placeholder: "john.doe@example.com",
    type: "email",
    autoComplete: "email",
    inputMode: "email",
  },
];

function validate(values: Record<Field, string>): Errors {
  // Client-side validation gives immediate feedback; the API repeats these
  // checks because browser validation can be bypassed.
  const e: Errors = {};
  const fullName = values.fullName.trim();
  if (!fullName) e.fullName = "We need your full name.";
  else if (fullName.length > 50) e.fullName = "Your name must be 50 characters or fewer.";

  const digits = values.phone.replace(/\D/g, "");
  if (!digits) e.phone = "We need a phone number.";
  else if (digits.length < 10 || digits.length > 14)
    e.phone = "That doesn't look like a Nigerian number.";

  const email = values.email.trim();
  if (!email) e.email = "We need an email.";
  else if (
    email.length > 254 ||
    email.includes("..") ||
    !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)
  )
    e.email = "Check that email address.";

  return e;
}

export default function RegisterForm() {
  const uid = useId();
  const reduced = useReducedMotion();
  const [values, setValues] = useState<Record<Field, string>>({
    fullName: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMsg, setServerMsg] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [returning, setReturning] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Update a field and revalidate it immediately once the user has touched it.
  const set = (name: Field, v: string) => {
    setValues((p) => ({ ...p, [name]: v }));
    if (touched[name]) {
      setErrors(validate({ ...values, [name]: v }));
    }
  };

  async function onSubmit(e: React.FormEvent) {
    // Validate before making a request, then focus the first invalid field.
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setTouched({ fullName: true, phone: true, email: true });

    if (Object.keys(found).length) {
      // Move the user to the first problem rather than leaving them hunting.
      const first = FIELDS.find((f) => found[f.name]);
      if (first) document.getElementById(`${uid}-${first.name}`)?.focus();
      return;
    }

    setStatus("submitting");
    setServerMsg("");
    try {
      if (STATIC_DEMO) {
        // The static preview simulates a successful submission locally.
        await new Promise((r) => setTimeout(r, 850));
        setEmailSent(false);
        setStatus("success");
        requestAnimationFrame(() =>
          cardRef.current?.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "center",
          }),
        );
        if (!reduced) {
          const { default: confetti } = await import("canvas-confetti");
          confetti({
            particleCount: 140,
            spread: 90,
            startVelocity: 42,
            origin: { y: 0.4 },
            colors: ["#b10008", "#f5d551", "#0a4e24", "#ffd701", "#fff9ec"],
            scalar: 1.1,
          });
        }
        return;
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Something went wrong.");

      setEmailSent(Boolean(data.emailSent));
      setReturning(Boolean(data.alreadyRegistered));
      setStatus("success");

      // The success panel is shorter than the form, so the page can end up
      // scrolled past it. Bring it back under the user's eyes.
      requestAnimationFrame(() =>
        cardRef.current?.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "center",
        }),
      );

      if (!reduced) {
        const { default: confetti } = await import("canvas-confetti");
        const rect = cardRef.current?.getBoundingClientRect();
        const origin = rect
          ? {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 3) / window.innerHeight,
            }
          : { x: 0.5, y: 0.4 };
        confetti({
          particleCount: 140,
          spread: 90,
          startVelocity: 42,
          origin,
          colors: ["#b10008", "#f5d551", "#0a4e24", "#ffd701", "#fff9ec"],
          scalar: 1.1,
        });
        setTimeout(
          () =>
            confetti({
              particleCount: 70,
              spread: 120,
              startVelocity: 30,
              origin,
              colors: ["#ffd701", "#b10008"],
            }),
          220,
        );
      }
    } catch (err) {
      setStatus("error");
      setServerMsg(
        err instanceof Error ? err.message : "Couldn't reach the server. Try again.",
      );
    }
  }

  return (
    <div
      ref={cardRef}
      className="relative mx-auto w-full max-w-[520px]"
      style={{ filter: "drop-shadow(0 18px 26px rgba(0,0,0,0.18))" }}
    >
      {/* torn-paper sheet, from the mockup */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cream"
        style={{
          backgroundImage: `url(${asset("/brand/torn-paper-sheet.webp")})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* min-height keeps the card from collapsing when the form swaps for the
          success panel, which would shift everything below it */}
      <div className="grid min-h-[520px] content-center px-7 py-8 sm:px-10 sm:py-10">
        <AnimatePresence mode="wait" initial={false}>
          {status === "success" ? (
            <SuccessPanel
              key="success"
              name={values.fullName}
              returning={returning}
              emailSent={emailSent}
            />
          ) : (
            <motion.div
              key="form"
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
              className="relative -left-3 mx-auto w-[90%] max-w-[370px]"
            >
              <h2 className="font-display text-center text-[clamp(2rem,5vw,2.9rem)] text-red">
                Register Now!
              </h2>
              <p className="mt-1 text-center text-sm font-semibold text-ink/70">
                Free entry. Takes about 20 seconds.
              </p>

              <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3">
                {FIELDS.map((f) => {
                  const err = touched[f.name] ? errors[f.name] : undefined;
                  const fid = `${uid}-${f.name}`;
                  return (
                    <div key={f.name}>
                      <div
                        className={cn(
                          "flex items-stretch overflow-hidden rounded-full border-2 bg-white transition-colors duration-150",
                          err ? "border-red" : "border-navy",
                        )}
                      >
                        <label
                          htmlFor={fid}
                          className={cn(
                            "flex shrink-0 items-center px-4 text-[13px] font-semibold text-white transition-colors duration-150",
                            err ? "bg-red" : "bg-navy",
                          )}
                        >
                          {f.label}
                        </label>
                        <input
                          id={fid}
                          name={f.name}
                          type={f.type}
                          inputMode={f.inputMode}
                          autoComplete={f.autoComplete}
                          placeholder={f.placeholder}
                          maxLength={f.maxLength}
                          value={values[f.name]}
                          disabled={status === "submitting"}
                          aria-invalid={!!err}
                          aria-describedby={err ? `${fid}-err` : undefined}
                          onChange={(e) => set(f.name, e.target.value)}
                          onBlur={() => {
                            setTouched((t) => ({ ...t, [f.name]: true }));
                            setErrors(validate(values));
                          }}
                          /* 16px keeps iOS from zooming the viewport on focus */
                          className="min-w-0 flex-1 bg-white px-4 py-2.5 text-[16px] text-ink outline-none placeholder:text-ink/35 disabled:opacity-60"
                        />
                      </div>
                      <AnimatePresence>
                        {err && (
                          <motion.p
                            id={`${fid}-err`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden pl-4 pt-1 text-[13px] font-semibold text-red"
                          >
                            {err}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                <motion.button
                  type="submit"
                  disabled={status === "submitting"}
                  whileTap={reduced ? undefined : { scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-red px-6 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-red-bright disabled:cursor-wait disabled:opacity-80"
                >
                  {status === "submitting" ? (
                    <>
                      <Spinner />
                      Saving your spot…
                    </>
                  ) : (
                    "Submit"
                  )}
                </motion.button>

                {/* Status is announced, and also visible as text + colour */}
                <p aria-live="polite" className="min-h-[1.25rem] text-center text-sm font-semibold text-red">
                  {status === "error" ? serverMsg : ""}
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

function SuccessPanel({
  name,
  returning,
  emailSent,
}: {
  name: string;
  returning: boolean;
  emailSent: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="text-center"
      role="status"
    >
      <motion.div
        initial={{ scale: 0.25, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.1 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green text-3xl"
      >
        🎉
      </motion.div>

      <h2 className="font-display mt-4 text-[clamp(1.8rem,4.6vw,2.5rem)] text-green">
        {returning ? "You're already in" : "You're in"}
        {name ? `, ${name}` : ""}!
      </h2>
      <p className="mx-auto mt-2 max-w-[34ch] text-pretty text-[15px] font-semibold leading-relaxed text-ink/80">
        {returning
          ? "We already had you on the guest list."
          : emailSent
            ? "Save the date — 7–8 November 2026 at Ikeja City Mall, from 9am. Check your inbox for the details."
            : "Save the date — 7–8 November 2026 at Ikeja City Mall, from 9am. Your registration is confirmed."}
      </p>
      {STATIC_DEMO && (
        <p className="mx-auto mt-2 max-w-[36ch] text-[12px] font-bold uppercase tracking-wide text-red/80">
          Demo build — nothing was actually submitted.
        </p>
      )}

      <motion.div
        initial={{ rotate: -6, y: 18, opacity: 0 }}
        animate={{ rotate: -2, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 13, delay: 0.25 }}
        className="relative mx-auto mt-6 w-full max-w-[330px]"
      >
        <div className="relative overflow-hidden rounded-xl border-[3px] border-dashed border-red bg-yellow px-5 py-4 text-center">
          <span
            aria-hidden="true"
            className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-cream"
          />
          <span
            aria-hidden="true"
            className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-cream"
          />
          <p className="font-display text-center text-xl tracking-wider text-red">
            Registration confirmed
          </p>
          <p className="mt-1 text-center text-[11px] font-bold uppercase tracking-wider text-green">
            Ikeja City Mall · 9am · Free
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
