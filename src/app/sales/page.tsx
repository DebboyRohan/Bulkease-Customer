// app/sales/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Search,
  Filter,
  Download,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingPage from "@/components/LoadingPage";
import { toast } from "sonner";
import { safeToFixed } from "@/lib/pricing-utils";

interface SalesOrder {
  id: string;
  totalQuantity: number;
  bookingAmount: number;
  finalAmount?: number | null;
  remainingAmount?: number | null;
  transactionId: string;
  status: "BOOKED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
  user: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    hall?: string | null;
    roll?: string | null;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    bookingPrice: number;
    finalPrice?: number | null;
    product?: {
      id: string;
      name: string;
      hasVariants: boolean;
    } | null;
    variant?: {
      id: string;
      name: string;
      product: {
        id: string;
        name: string;
      };
    } | null;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "BOOKED":
      return "bg-blue-100 text-blue-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "REFUNDED":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function SalesPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Changed from "" to "all"
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        router.push("/sign-in");
        return;
      }
      fetchOrders();
    }
  }, [userId, isLoaded, search, statusFilter, sortBy, sortOrder, page]);

  const fetchOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });

      if (search) queryParams.append("search", search);
      // Only append status if it's not "all"
      if (statusFilter && statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }

      const response = await fetch(`/api/sales/orders?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      } else if (response.status === 403) {
        toast.error("Access denied. Sales role required.");
        router.push("/");
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/sales/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Order status updated successfully");
        await fetchOrders();
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const SortButton = ({
    column,
    children,
  }: {
    column: string;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="h-auto p-0 font-medium justify-start"
    >
      {children}
      {sortBy === column &&
        (sortOrder === "asc" ? (
          <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1" />
        ))}
    </Button>
  );

  if (!isLoaded || loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sales Management
          </h1>
          <p className="text-gray-600">
            Manage orders and track sales performance
            {pagination && ` • ${pagination.total} orders total`}
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search orders, customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="BOOKED">Booked</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="bookingAmount-desc">
                    Amount: High to Low
                  </SelectItem>
                  <SelectItem value="bookingAmount-asc">
                    Amount: Low to High
                  </SelectItem>
                  <SelectItem value="totalQuantity-desc">
                    Quantity: High to Low
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({pagination?.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton column="id">Order ID</SortButton>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>
                      <SortButton column="totalQuantity">Quantity</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton column="bookingAmount">Amount</SortButton>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <SortButton column="createdAt">Date</SortButton>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.user.name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.user.email}
                          </p>
                          {order.user.roll && (
                            <p className="text-xs text-gray-500">
                              Roll: {order.user.roll}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.orderItems.slice(0, 2).map((item) => {
                            const isVariant = !!item.variant;
                            const product = isVariant
                              ? item.variant!.product
                              : item.product!;
                            const variantName = item.variant?.name;

                            return (
                              <p key={item.id} className="text-sm">
                                {item.quantity}x {product.name}
                                {variantName && ` (${variantName})`}
                              </p>
                            );
                          })}
                          {order.orderItems.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{order.orderItems.length - 2} more
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{order.totalQuantity}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            ₹{safeToFixed(order.bookingAmount)}
                          </p>
                          {order.finalAmount && (
                            <p className="text-sm text-gray-500">
                              Final: ₹{safeToFixed(order.finalAmount)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateOrderStatus(order.id, value)
                          }
                          disabled={updating === order.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BOOKED">BOOKED</SelectItem>
                            <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                            <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/sales/orders/${order.id}`)
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.pages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={
                            pageNum === page
                              ? "bg-green-600 hover:bg-green-700"
                              : ""
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
