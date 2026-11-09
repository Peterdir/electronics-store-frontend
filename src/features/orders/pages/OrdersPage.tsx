import { useEffect } from "react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/shared/types/enums";

import { OrderCard } from "../components/OrderCard";
import { OrderStatusTabs } from "../components/OrderStatusTabs";
import { useGetOrders } from "../queries";
import { Pagination } from "@/shared/components/Pagination";

function parseStatus(
  value: string | null,
): OrderStatus | undefined {
  return Object.values(OrderStatus).find(
    (status) => status === value,
  );
}

function parsePage(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return 1;
  }

  const page = Number(value);

  return Number.isSafeInteger(page) &&
    page <= 2_147_483_647
    ? page
    : 1;
}

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get("status");
  const status = parseStatus(rawStatus);
  const invalidStatus = rawStatus !== null && !status;

  const currentPage = invalidStatus
    ? 1
    : parsePage(searchParams.get("page"));

  const normalized = new URLSearchParams(searchParams);

  if (status) {
    normalized.set("status", status);
  } else {
    normalized.delete("status");
  }

  normalized.set("page", String(currentPage));

  const normalizedSearch = normalized.toString();
  const isCanonical = normalizedSearch === searchParams.toString();

  useEffect(() => {
    if (!isCanonical) {
      setSearchParams(normalizedSearch, { replace: true });
    }
  }, [isCanonical, normalizedSearch, setSearchParams]);

  const ordersQuery = useGetOrders(
    {
      orderStatus: status,
      page: currentPage - 1,
      size: 10,
      sortBy: "createdAt",
      direction: "desc",
    },
    isCanonical,
  );

  const data = ordersQuery.data;
  const totalPages = data?.totalPages;

  useEffect(() => {
    if (
      !isCanonical ||
      ordersQuery.isFetching ||
      ordersQuery.isError ||
      totalPages === undefined
    ) {
      return;
    }

    const lastPage = Math.max(1, totalPages);

    if (currentPage <= lastPage) return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(lastPage));
      return next;
    }, { replace: true });
  }, [
    isCanonical,
    ordersQuery.isFetching,
    ordersQuery.isError,
    totalPages,
    currentPage,
    setSearchParams,
  ]);

  function changeStatus(nextStatus: OrderStatus | undefined) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (nextStatus) {
        next.set("status", nextStatus);
      } else {
        next.delete("status");
      }

      next.set("page", "1");

      return next;
    });
  }

  function changePage(nextPage: number) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(nextPage));
      return next;
    });
  }

  const correctingPage =
    !ordersQuery.isError &&
    data !== undefined &&
    currentPage > Math.max(1, data.totalPages);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">
        Đơn hàng của tôi
      </h1>

      <OrderStatusTabs
        value={status}
        onChange={changeStatus}
      />

      {!isCanonical || ordersQuery.isPending || correctingPage ? (
        <p role="status">Đang tải đơn hàng…</p>
      ) : !data ? (
        <div role="alert" className="space-y-3">
          <p>
            {ordersQuery.error?.message ||
              "Không tải được danh sách đơn hàng."}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={ordersQuery.isFetching}
              onClick={() => void ordersQuery.refetch()}
            >
              Thử lại
            </Button>

            {currentPage > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => changePage(1)}
              >
                Về trang đầu
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {ordersQuery.isError && (
            <div role="alert" className="space-y-2">
              <p>
                Không cập nhật được đơn hàng.
                Dữ liệu đang hiển thị có thể chưa mới nhất.
              </p>

              <Button
                type="button"
                variant="outline"
                disabled={ordersQuery.isFetching}
                onClick={() => void ordersQuery.refetch()}
              >
                Thử lại
              </Button>
            </div>
          )}

          {ordersQuery.isFetching && (
            <p role="status">
              Đang cập nhật đơn hàng…
            </p>
          )}

          {data.items.length === 0 ? (
            <p className="text-muted-foreground">
              {status
                ? "Chưa có đơn hàng ở trạng thái này."
                : "Bạn chưa có đơn hàng."}
            </p>
          ) : (
            <div className="space-y-4">
              {data.items.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                />
              ))}
            </div>
          )}

          <Pagination
            ariaLabel="Phân trang đơn hàng"
            currentPage={currentPage}
            totalPages={data.totalPages}
            isFetching={ordersQuery.isFetching}
            onPageChange={changePage}
          />
        </>
      )}
    </section>
  );
}