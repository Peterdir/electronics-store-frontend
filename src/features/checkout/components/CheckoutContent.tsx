import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/features/address/components/AddressForm";
import { useGetAddresses } from "@/features/address/queries";
import {
  emptyAddressValues,
  toManualCheckoutAddress,
  type AddressFormValues,
} from "@/features/address/schemas";
import type { ID } from "@/shared/types/common";
import { z } from "zod";
import { shippingOptions, type ShippingMethod } from "../checkoutOptions";
import { PaymentMethod } from "@/shared/types/enums";
import { CouponInput, PaymentMethodSelector, ShippingMethodSelector } from "./CheckoutOptions";
import { OrderSummaryPanel } from "./OrderSummaryPanel";
import { useSession } from "@/shared/auth/session.store";
import { ApiError } from "@/shared/api/errors";
import { buildCheckoutRequest } from "../buildCheckoutRequest";
import { usePlaceOrder } from "../queries";
import { isCheckoutSessionCurrent } from "../session";
import type { CheckoutSource } from "../types";
import { getVnpayRedirectUrl } from "@/features/payment/redirect";

interface Props {
  userId: ID | null;
  subtotal: number,
  source: CheckoutSource;
  canSubmit?: boolean;
  children: ReactNode;
}

const contactEmailSchema = z
  .string()
  .trim()
  .max(254, "Email tối đa 254 ký tự.")
  .email("Email không hợp lệ.")
  .optional();

export function CheckoutContent({ userId, subtotal, source, canSubmit = true, children }: Props) {
  const navigate = useNavigate();
  const placeOrder = usePlaceOrder();
  const submitting = useRef(false);
  const mounted = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(null);
  const busy = placeOrder.isPending || completed;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const addresses = useGetAddresses();
  const emailId = useId();
  const [contactEmail, setContactEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("STANDARD");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.COD);

  const [couponCode, setCouponCode] = useState("");

  const shippingFee = shippingOptions[shippingMethod].fee;

  const emailResult = contactEmailSchema.safeParse(
    contactEmail.trim() || undefined,
  );

  const emailError =
    emailTouched && !emailResult.success
      ? emailResult.error.issues[0]?.message
      : undefined;

  const [mode, setMode] = useState<"saved" | "manual">(
    userId === null ? "manual" : "saved",
  );
  const [selectedId, setSelectedId] = useState<ID | null>(null);
  const [manualValues, setManualValues] = useState<AddressFormValues | null>(null);

  const selectedAddress = addresses.isSuccess
    ? addresses.data.find((item) => item.id === selectedId) ??
      addresses.data.find((item) => item.isDefault) ??
      addresses.data[0]
    : undefined;

  const emptyAddressBook =
    userId !== null &&
    addresses.isSuccess &&
    addresses.data.length === 0;

  const useManualAddress =
    userId === null ||
    mode === "manual" ||
    emptyAddressBook;

  const addressFields = useManualAddress
    ? manualValues
      ? toManualCheckoutAddress(manualValues)
      : null
    : selectedAddress
      ? { addressId: selectedAddress.id }
      : null;

  async function handlePlaceOrder() {
    if (submitting.current || busy || outcomeUnknown || !canSubmit) return;

    setEmailTouched(true);
    setSubmitError(null);
    setPaymentRedirectUrl(null);

    if (!addressFields) {
      setSubmitError("Vui lòng chọn hoặc xác nhận địa chỉ nhận hàng.");
      return;
    }
    if (!emailResult.success) {
      document.getElementById(emailId)?.focus();
      return;
    }

    const session = { userId, token: useSession.getState().token };
    submitting.current = true;

    try {
      const payload = buildCheckoutRequest({
        source,
        address: addressFields,
        shippingMethod,
        paymentMethod,
        couponCode,
        contactEmail: emailResult.data ?? "",
      });
      const result = await placeOrder.mutateAsync({ payload, session, source });
      if (!mounted.current || !isCheckoutSessionCurrent(session)) return;

      const order = result.confirmation.order;
      setCompleted(true);

      try {
        if (order.paymentMethod === PaymentMethod.VNPAY) {
          const url = getVnpayRedirectUrl(order);
          setPaymentRedirectUrl(url);
          window.location.assign(url);
          return;
        }

        await navigate(`/checkout/success/${order.orderId}`, {
          replace: true,
          state: result,
        });
      } catch {
        if (mounted.current) {
          setSubmitError(
            `Đơn ${order.orderId} đã được tạo nhưng chưa mở được trang tiếp theo. Vui lòng giữ lại mã đơn.`,
          );
        }
      }
    } catch (error) {
      if (!mounted.current) return;
      const unknown = error instanceof ApiError && (error.status === 0 || error.status >= 500);
      setOutcomeUnknown(unknown);
      setSubmitError(unknown
        ? "Chưa xác định được kết quả đặt hàng. Đơn có thể đã được tạo; hãy kiểm tra với cửa hàng trước khi đặt lại."
        : error instanceof Error ? error.message : "Không thể đặt hàng.");
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Thanh toán</h1>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-5 tabular-nums sm:p-6">{children}</div>

      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <legend className="sr-only">Thông tin đặt hàng</legend>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">
            Thông tin liên hệ
          </h2>

          <div className="space-y-2">
            <label
              htmlFor={emailId}
              className="block text-sm font-medium"
            >
              Email nhận thông tin đơn hàng
              <span className="ml-1 font-normal text-muted-foreground">
                (không bắt buộc)
              </span>
            </label>

            <input
              id={emailId}
              name="contactEmail"
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              onBlur={() => setEmailTouched(true)}
              aria-invalid={Boolean(emailError)}
              aria-describedby={
                emailError
                  ? `${emailId}-help ${emailId}-error`
                  : `${emailId}-help`
              }
              className="form-control"
            />

            <p
              id={`${emailId}-help`}
              className="text-sm text-muted-foreground"
            >
              {userId === null
                ? "Bạn có thể cung cấp email để nhận thông tin đơn hàng."
                : "Để trống để sử dụng email của tài khoản."}
            </p>

            {emailError && (
              <p
                id={`${emailId}-error`}
                role="alert"
                className="text-sm text-destructive"
              >
                {emailError}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">
            Địa chỉ nhận hàng
          </h2>

          {userId !== null && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={mode === "saved" ? "default" : "outline"}
                onClick={() => setMode("saved")}
              >
                Địa chỉ đã lưu
              </Button>

              <Button
                type="button"
                variant={mode === "manual" ? "default" : "outline"}
                onClick={() => setMode("manual")}
              >
                Nhập địa chỉ khác
              </Button>
            </div>
          )}

          {userId !== null && mode === "saved" && (
            <>
              {addresses.isPending && (
                <p role="status">Đang tải địa chỉ...</p>
              )}

              {addresses.isError && (
                <div className="space-y-2">
                  <p role="alert" className="text-destructive">
                    {addresses.error.message}
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={addresses.isFetching}
                    onClick={() => void addresses.refetch()}
                  >
                    Thử lại
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    Bạn cũng có thể chọn nhập địa chỉ khác.
                  </p>
                </div>
              )}

              {emptyAddressBook && (
                <p className="text-sm text-muted-foreground">
                  Bạn chưa lưu địa chỉ. Hãy nhập địa chỉ bên dưới.
                </p>
              )}

              {addresses.isSuccess &&
                addresses.data.length > 0 && (
                  <fieldset className="space-y-2">
                    <legend className="sr-only">
                      Chọn địa chỉ nhận hàng
                    </legend>

                    {addresses.data.map((address) => (
                      <label
                        key={address.id}
                        className="flex min-w-0 cursor-pointer gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <input
                          type="radio"
                          name="delivery-address"
                          value={address.id}
                          checked={
                            selectedAddress?.id === address.id
                          }
                          onChange={() =>
                            setSelectedId(address.id)
                          }
                        />

                        <span className="min-w-0 text-sm wrap-anywhere">
                          <span className="font-medium">
                            {address.fullName} · {address.phone}
                          </span>

                          {address.isDefault && (
                            <span className="ml-2 text-primary">
                              Mặc định
                            </span>
                          )}

                          <span className="block text-muted-foreground">
                            {[
                              address.specificAddress,
                              address.ward,
                              address.district,
                              address.province,
                            ].join(", ")}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )}
            </>
          )}

          <div hidden={!useManualAddress}>
            <AddressForm
              initialValues={emptyAddressValues}
              submitLabel="Xác nhận địa chỉ"
              onSubmit={(values) => {
                setManualValues(values);
              }}
              onValuesEdited={() => {
                setManualValues(null);
              }}
            />
          </div>

          {addressFields && (
            <div
              role="status"
              className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm wrap-anywhere"
            >
              <p className="font-medium text-primary">
                Địa chỉ nhận hàng đã sẵn sàng.
              </p>

              {"shippingAddress" in addressFields ? (
                <p>
                  {addressFields.recipientName} ·{" "}
                  {addressFields.recipientPhone}
                  <br />
                  {addressFields.shippingAddress}
                </p>
              ) : selectedAddress ? (
                <p>
                  {selectedAddress.fullName} ·{" "}
                  {selectedAddress.phone}
                  <br />
                  {[
                    selectedAddress.specificAddress,
                    selectedAddress.ward,
                    selectedAddress.district,
                    selectedAddress.province,
                  ].join(", ")}
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <ShippingMethodSelector
            value={shippingMethod}
            onChange={setShippingMethod}
          />

          <PaymentMethodSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
          />

          <CouponInput
            value={couponCode}
            onChange={setCouponCode}
          />
        </section>

        <OrderSummaryPanel
          subtotal={subtotal}
          shippingFee={shippingFee}
        />
      </fieldset>

      <div className="space-y-3">
        {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
        <Button
          type="button"
          className="min-h-11 w-full"
          disabled={busy || outcomeUnknown || !canSubmit}
          onClick={() => void handlePlaceOrder()}
        >
          {completed
            ? "Đơn đã được tạo"
            : placeOrder.isPending
              ? "Đang xử lý đơn hàng..."
              : paymentMethod === PaymentMethod.VNPAY
                ? "Đặt hàng và thanh toán VNPay"
                : "Đặt hàng COD"}
        </Button>
        {submitError && paymentRedirectUrl && (
          <a
            href={paymentRedirectUrl}
            className="inline-block text-primary underline"
          >
            Mở cổng thanh toán cho đơn đã tạo
          </a>
        )}
      </div>
    </section>
  );
}
