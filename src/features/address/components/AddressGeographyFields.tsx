import { useQuery } from "@tanstack/react-query";
import {
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import type { AddressFormValues } from "../schemas";

interface Division {
  code: number;
  name: string;
}

interface Props {
  idPrefix: string;
  control: Control<AddressFormValues>;
  register: UseFormRegister<AddressFormValues>;
  setValue: UseFormSetValue<AddressFormValues>;
  errors: FieldErrors<AddressFormValues>;
}

async function getDivisions(
  path: string,
  signal?: AbortSignal,
): Promise<Division[]> {
  const response = await fetch(
    `https://provinces.open-api.vn/api/v2${path}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error("Không tải được danh sách địa giới.");
  }

  const data: unknown = await response.json();

  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    !data.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.code === "number" &&
        typeof item.name === "string",
    )
  ) {
    throw new Error("Dữ liệu địa giới không hợp lệ.");
  }

  return data as Division[];
}

export function AddressGeographyFields({
  idPrefix,
  control,
  register,
  setValue,
  errors,
}: Props) {
  const province = useWatch({ control, name: "province" });
  const ward = useWatch({ control, name: "ward" });

  const provinces = useQuery({
    queryKey: ["geography", "provinces"],
    queryFn: ({ signal }) => getDivisions("/p/", signal),
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  const provinceCode = provinces.data?.find(
    (item) => item.name === province,
  )?.code;

  const wards = useQuery({
    queryKey: ["geography", "wards", provinceCode],
    queryFn: ({ signal }) =>
      getDivisions(`/w/?province=${provinceCode}`, signal),
    enabled: provinceCode !== undefined,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  const provinceField = register("province");
  const wardField = register("ward");

  const manualWard =
    provinces.isError ||
    wards.isError ||
    (province !== "" && provinceCode === undefined);

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2";

  return (
    <>
      <div className="space-y-1">
        <label
          htmlFor={`${idPrefix}-province`}
          className="block text-sm font-medium"
        >
          Tỉnh/thành phố
        </label>

        {provinces.isError ? (
          <input
            {...provinceField}
            id={`${idPrefix}-province`}
            className={inputClass}
            aria-invalid={Boolean(errors.province)}
            aria-describedby={
              errors.province
                ? `${idPrefix}-province-error`
                : undefined
            }
          />
        ) : (
          <select
            {...provinceField}
            id={`${idPrefix}-province`}
            disabled={provinces.isPending}
            className={inputClass}
            aria-invalid={Boolean(errors.province)}
            aria-describedby={
              errors.province
                ? `${idPrefix}-province-error`
                : undefined
            }
            onChange={(event) => {
              void provinceField.onChange(event);

              // Tỉnh thay đổi thì địa chỉ phụ thuộc cần nhập lại.
              setValue("ward", "", { shouldDirty: true });
              setValue("district", "", { shouldDirty: true });
            }}
          >
            <option value="">
              {provinces.isPending
                ? "Đang tải tỉnh/thành phố..."
                : "Chọn tỉnh/thành phố"}
            </option>

            {province &&
              !provinces.data?.some(
                (item) => item.name === province,
              ) && (
                <option value={province}>{province}</option>
              )}

            {provinces.data?.map((item) => (
              <option key={item.code} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        )}

        {provinces.isError && (
          <p className="text-xs text-muted-foreground">
            Không tải được danh sách. Bạn có thể nhập tay.
          </p>
        )}

        {errors.province && (
          <p
            id={`${idPrefix}-province-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.province.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`${idPrefix}-ward`}
          className="block text-sm font-medium"
        >
          Xã/phường
        </label>

        {manualWard ? (
          <input
            {...wardField}
            id={`${idPrefix}-ward`}
            className={inputClass}
            aria-invalid={Boolean(errors.ward)}
            aria-describedby={
              errors.ward ? `${idPrefix}-ward-error` : undefined
            }
          />
        ) : (
          <select
            {...wardField}
            id={`${idPrefix}-ward`}
            disabled={
              provinceCode === undefined || wards.isPending
            }
            className={inputClass}
            aria-invalid={Boolean(errors.ward)}
            aria-describedby={
              errors.ward ? `${idPrefix}-ward-error` : undefined
            }
          >
            <option value="">
              {provinceCode !== undefined && wards.isPending
                ? "Đang tải xã/phường..."
                : "Chọn xã/phường"}
            </option>

            {ward &&
              !wards.data?.some((item) => item.name === ward) && (
                <option value={ward}>{ward}</option>
              )}

            {wards.data?.map((item) => (
              <option key={item.code} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        )}

        {wards.isError && (
          <p className="text-xs text-muted-foreground">
            Không tải được danh sách. Bạn có thể nhập tay.
          </p>
        )}

        {errors.ward && (
          <p
            id={`${idPrefix}-ward-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.ward.message}
          </p>
        )}
      </div>
    </>
  );
}