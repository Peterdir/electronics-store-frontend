import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/features/address/components/AddressForm";
import { useGetAddresses } from "@/features/address/queries";
import {
  emptyAddressValues,
  toManualCheckoutAddress,
  type AddressFormValues,
} from "@/features/address/schemas";
import type { ID } from "@/shared/types/common";

interface Props {
  userId: ID | null;
  children: ReactNode;
}

export function CheckoutContent({ userId, children }: Props) {
  const addresses = useGetAddresses();

  const [mode, setMode] = useState<"saved" | "manual">(
    userId === null ? "manual" : "saved",
  );
  const [selectedId, setSelectedId] = useState<ID | null>(null);
  const [manualValues, setManualValues] =
    useState<AddressFormValues | null>(null);

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

  // C10 sẽ ghép các trường này vào CheckoutRequest.
  const addressFields = useManualAddress
    ? manualValues
      ? toManualCheckoutAddress(manualValues)
      : null
    : selectedAddress
      ? { addressId: selectedAddress.id }
      : null;

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Thanh toán</h1>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-5 tabular-nums sm:p-6">{children}</div>

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

        {/* Giữ form mounted để chuyển chế độ không mất bản nháp. */}
        <div hidden={!useManualAddress}>
          <AddressForm
            initialValues={emptyAddressValues}
            submitLabel="Xác nhận địa chỉ"
            onSubmit={(values) => {
              setManualValues(values);
            }}
            onValuesEdited={() => {
              // Người dùng sửa thì cần xác nhận lại bản mới.
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
    </section>
  );
}
