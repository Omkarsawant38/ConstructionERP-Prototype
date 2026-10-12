"use client";

import React, { useState } from "react";
import { formatCurrencyFull, formatDateShort } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/lib/rbac/client";
import type { MaterialRequest, MaterialRequestItem } from "@/types";
import {
  X,
  FileText,
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  PackageCheck,
  AlertCircle,
  Loader2,
  Tag,
  FileCheck,
} from "lucide-react";

interface MaterialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaterialRequest | null;
  onApproveSuccess: (updatedRequest: MaterialRequest) => void;
  onOpenReceiptForRequest: (requestId: string) => void;
}

export function MaterialDetailModal({
  isOpen,
  onClose,
  request,
  onApproveSuccess,
  onOpenReceiptForRequest,
}: MaterialDetailModalProps) {
  const { user } = useAuth();
  const { hasPermission, hasRole } = usePermissions();

  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState<"approve" | "reject" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const canApprovePermission =
    hasRole("super_admin", "owner_director", "project_manager") ||
    hasPermission("inventory.approve");

  // Anti-self-approval policy check
  const isCreator = user && request.requested_by === user.id;
  const isSuperAdmin = hasRole("super_admin");
  const isSelfApprovalBlocked = isCreator && !isSuperAdmin;

  const handleAction = async (action: "approve" | "reject") => {
    setErrorMsg(null);
    setSubmittingAction(action);

    try {
      const res = await fetch(`/api/materials/requests/${request.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: reviewNotes.trim() || undefined,
          rejection_reason: action === "reject" ? reviewNotes.trim() || "Rejected by manager" : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} request`);
      }

      onApproveSuccess(data.request);
      onClose();
    } catch (err: any) {
      console.error("Approval error:", err);
      setErrorMsg(err.message || `Failed to ${action} request.`);
    } finally {
      setSubmittingAction(null);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "fulfilled":
        return "bg-green-100 text-green-800 border-green-200";
      case "partially_fulfilled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const totalReqValue = (request.items || []).reduce(
    (sum, item) => sum + (item.quantity * (item.estimated_unit_cost || 0)),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{request.request_number}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(request.status)} capitalize`}>
                  {request.status.replace("_", " ")}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getPriorityBadge(request.priority)} uppercase`}>
                  {request.priority}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Created on {formatDateShort(request.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Key Meta details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
            <div>
              <span className="text-gray-400 font-medium block mb-1">Required Delivery Date</span>
              <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                <Calendar size={14} className="text-amber-600" />
                {request.required_date}
              </div>
            </div>
            <div>
              <span className="text-gray-400 font-medium block mb-1">Delivery Location</span>
              <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                <MapPin size={14} className="text-amber-600" />
                {request.delivery_location || "Project Site"}
              </div>
            </div>
            <div>
              <span className="text-gray-400 font-medium block mb-1">Requested By</span>
              <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                <User size={14} className="text-amber-600" />
                {request.requested_by_name || "Authorized User"}
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">Line Items</h3>
              <span className="text-xs text-gray-500 font-medium">
                Est. Indent Value: <strong className="text-gray-800">{formatCurrencyFull(totalReqValue)}</strong>
              </span>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3 text-right">Requested</th>
                    <th className="py-2.5 px-3 text-right">Fulfilled</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3 text-right">Est. Rate</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(request.items || []).map((item, idx) => {
                    const fulfilled = Number(item.fulfilled_quantity || 0);
                    const pending = Math.max(0, item.quantity - fulfilled);
                    return (
                      <tr key={item.id || idx} className="hover:bg-amber-50/20">
                        <td className="p-3 font-semibold text-gray-900">
                          {item.material_name || "Material"}
                        </td>
                        <td className="p-3 text-right font-medium text-gray-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3 text-right font-semibold text-green-700">
                          {fulfilled} {item.unit}
                        </td>
                        <td className="p-3 text-right font-semibold text-amber-700">
                          {pending} {item.unit}
                        </td>
                        <td className="p-3 text-right text-gray-600">
                          {formatCurrencyFull(item.estimated_unit_cost || 0)}
                        </td>
                        <td className="p-3 text-gray-500">
                          {item.notes || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes or Justification */}
          {request.notes && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
              <span className="font-semibold text-gray-700 block mb-1">Requester Notes / Justification:</span>
              <p className="text-gray-600">{request.notes}</p>
            </div>
          )}

          {/* Approval Record if resolved */}
          {request.approved_by_name && (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className={request.status === "rejected" ? "text-red-500" : "text-green-600"} />
                <span className="font-bold text-gray-800">
                  {request.status === "rejected" ? "Review Rejection" : "Approval Record"}
                </span>
              </div>
              <p className="text-gray-600">
                Action by <strong>{request.approved_by_name}</strong> on {formatDateShort(request.approved_at || "")}
              </p>
              {request.approval_notes && (
                <p className="text-gray-700 italic">"{request.approval_notes}"</p>
              )}
              {request.rejection_reason && (
                <p className="text-red-700 font-medium">Reason: {request.rejection_reason}</p>
              )}
            </div>
          )}

          {/* Reviewer Action Area for pending requests */}
          {request.status === "pending_approval" && canApprovePermission && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Review & Authorization
              </h4>
              {isSelfApprovalBlocked ? (
                <div className="p-2.5 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>
                    You submitted this request. Separation of duties prevents you from approving your own request. Another Project Manager or Super Admin must authorize it.
                  </span>
                </div>
              ) : (
                <>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter approval comments, site verification remarks, or rejection reason..."
                    className="form-input text-xs w-full bg-white"
                  />
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleAction("reject")}
                      disabled={submittingAction !== null}
                      className="btn btn-secondary text-xs py-2 px-3 border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1.5"
                    >
                      {submittingAction === "reject" ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      <span>Reject Request</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction("approve")}
                      disabled={submittingAction !== null}
                      className="btn btn-primary text-xs py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-1.5"
                    >
                      {submittingAction === "approve" ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      <span>Approve Request</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {request.status === "approved" || request.status === "partially_fulfilled" ? (
              <span className="text-green-700 font-medium flex items-center gap-1">
                <CheckCircle2 size={14} /> Approved for site delivery and stock inward
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {(request.status === "approved" || request.status === "partially_fulfilled") && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReceiptForRequest(request.id);
                }}
                className="btn btn-primary text-xs py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-1.5"
              >
                <PackageCheck size={14} />
                <span>Record Receipt for this Indent</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs py-2 px-4"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
