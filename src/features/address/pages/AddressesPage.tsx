import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ID } from "@/shared/types/common";
import { AddressCard } from "../components/AddressCard";
import { AddressForm } from "../components/AddressForm";
import {
  useGetAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "../queries";
import {
  emptyAddressValues,
  toAddressRequest,
  type AddressFormValues,
} from "../schemas";

type FormMode =
  | { kind: "create" }
  | { kind: "edit"; id: ID }
  | null;

export function AddressesPage() {
  const getAddresses = useGetAddresses();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [mode, setMode] = useState<FormMode>(null);
  const [deleteId, setDeleteId] = useState<ID | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    create.isPending ||
    update.isPending ||
    remove.isPending ||
    setDefault.isPending;

  const editing =
    mode?.kind === "edit"
      ? getAddresses.data?.find((item) => item.id === mode.id)
      : undefined;

  function openCreate() {
    setFormError(null);
    setDeleteId(null);
    setActionError(null);
    setMode({ kind: "create" });
  }

  function openEdit(id: ID) {
    setFormError(null);
    setDeleteId(null);
    setActionError(null);
    setMode({ kind: "edit", id });
  }

  async function handleSave(values: AddressFormValues) {
    if (!mode || busy) return;
    setFormError(null);

    try {
      const payload = toAddressRequest({
        ...values,
        isDefault: editing?.isDefault
          ? true
          : values.isDefault,
      });

      if (mode.kind === "create") {
        await create.mutateAsync(payload);
      } else {
        await update.mutateAsync({
          id: mode.id,
          payload,
        });
      }

      setMode(null);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Không thể lưu địa chỉ.",
      );
    }
  }

  async function handleDelete(id: ID) {
    if (busy) return;
    setActionError(null);

    try {
      await remove.mutateAsync(id);
      setDeleteId(null);

      if (mode?.kind === "edit" && mode.id === id) {
        setMode(null);
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Không thể xóa địa chỉ.",
      );
    }
  }

  async function handleSetDefault(id: ID) {
    if (busy) return;
    setActionError(null);

    try {
      await setDefault.mutateAsync(id);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Không thể đổi địa chỉ mặc định.",
      );
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Sổ địa chỉ</h1>

        <Button
          type="button"
          disabled={busy}
          onClick={openCreate}
        >
          Thêm địa chỉ
        </Button>
      </div>

      {mode && (mode.kind === "create" || editing) && (
        <div className="space-y-4 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">
            {mode.kind === "create"
              ? "Thêm địa chỉ"
              : "Sửa địa chỉ"}
          </h2>

          <AddressForm
            key={mode.kind === "create" ? "new" : mode.id}
            initialValues={
              editing
                ? {
                    fullName: editing.fullName,
                    phone: editing.phone,
                    province: editing.province,
                    district: editing.district,
                    ward: editing.ward,
                    specificAddress: editing.specificAddress,
                    isDefault: Boolean(editing.isDefault),
                  }
                : emptyAddressValues
            }
            submitLabel="Lưu địa chỉ"
            showDefault={!editing?.isDefault}
            isSubmitting={busy}
            serverError={formError}
            onSubmit={handleSave}
            onCancel={() => setMode(null)}
          />
        </div>
      )}

      {getAddresses.isPending && (
        <p role="status">Đang tải địa chỉ...</p>
      )}

      {getAddresses.isError && (
        <div className="space-y-2">
          <p role="alert">{getAddresses.error.message}</p>
          <Button
            type="button"
            variant="outline"
            disabled={getAddresses.isFetching}
            onClick={() => void getAddresses.refetch()}
          >
            Thử lại
          </Button>
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-destructive">
          {actionError}
        </p>
      )}

      {getAddresses.isSuccess &&
        getAddresses.data.length === 0 && (
          <p>Bạn chưa lưu địa chỉ nào.</p>
        )}

      {getAddresses.isSuccess && (
        <div className="grid gap-4 sm:grid-cols-2">
          {getAddresses.data.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              busy={busy}
              confirmingDelete={deleteId === address.id}
              onEdit={() => openEdit(address.id)}
              onSetDefault={() =>
                void handleSetDefault(address.id)
              }
              onRequestDelete={() => setDeleteId(address.id)}
              onConfirmDelete={() =>
                void handleDelete(address.id)
              }
              onCancelDelete={() => setDeleteId(null)}
            />
          ))}
        </div>
      )}
    </section>
  );
}