"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/lib/user-context";
import {
  fetchBillById,
  fetchProperties,
  getBillPaymentSummary,
  getBillSectionSummary,
  submitBillPaymentClaim,
  verifyBillPaymentClaim,
  uploadBillPaymentEvidence,
  type BillRecord,
  type PropertyRecord,
} from "@/lib/rental-data";
import { formatNepaliDateTimeFromAd } from "@/lib/date-utils";

const formatNpr = (value: number) => `NPR ${value.toFixed(2)}`;

export default function BillDetailPage() {
  const params = useParams();
  const { user } = useUser();
  const billId = Number(params.id);

  const [bill, setBill] = useState<BillRecord | null>(null);
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payOpen, setPayOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [remarks, setRemarks] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [verifyingClaimId, setVerifyingClaimId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const loadBill = async () => {
    if (!Number.isFinite(billId) || billId <= 0) {
      setError("Invalid bill ID.");
      setLoading(false);
      return;
    }

    try {
      const [billData, propertyData] = await Promise.all([
        fetchBillById(billId),
        fetchProperties(),
      ]);

      setBill(billData);
      setProperty(propertyData.find((entry) => entry.id === billData.property_id) || null);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load bill");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billId]);

  const sections = useMemo(() => (bill ? getBillSectionSummary(bill) : null), [bill]);
  const paymentSummary = useMemo(() => (bill ? getBillPaymentSummary(bill) : null), [bill]);
  const isTenantSide = useMemo(() => {
    if (!property) {
      return false;
    }
    return property.owner_profile_id !== user.profileId;
  }, [property, user.profileId]);

  const handleEvidenceChange = (file: File | null) => {
    setPayError(null);
    if (!file) {
      setEvidenceFile(null);
      return;
    }

    const supported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) {
      setPayError("Only PDF and image evidence files are supported.");
      setEvidenceFile(null);
      return;
    }

    setEvidenceFile(file);
  };

  const handleSubmitPaymentClaim = async () => {
    if (!bill || !paymentSummary) {
      return;
    }

    setPayError(null);
    setPaying(true);

    try {
      const parsedAmount = Number(amountPaid.trim());
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Paid amount must be greater than 0.");
      }

      let evidencePayload: {
        url: string;
        mimeType: string | null;
        name: string | null;
      } | null = null;

      if (evidenceFile) {
        const uploaded = await uploadBillPaymentEvidence(bill.id, evidenceFile);
        evidencePayload = {
          url: uploaded.url,
          mimeType: uploaded.mimeType,
          name: uploaded.name,
        };
      }

      const updated = await submitBillPaymentClaim({
        billId: bill.id,
        amountPaid: parsedAmount,
        remarks: remarks.trim(),
        payer: "tenant",
        proofUrl: evidencePayload?.url,
        proofMimeType: evidencePayload?.mimeType || undefined,
        proofName: evidencePayload?.name || undefined,
      });

      setBill(updated);
      setPayOpen(false);
      setAmountPaid("");
      setRemarks("");
      setEvidenceFile(null);
    } catch (caughtError) {
      setPayError(caughtError instanceof Error ? caughtError.message : "Failed to submit payment claim");
    } finally {
      setPaying(false);
    }
  };

  const handleVerifyClaim = async (claimId: string) => {
    if (!bill) {
      return;
    }

    setVerifyError(null);
    setVerifyingClaimId(claimId);
    try {
      const updated = await verifyBillPaymentClaim({
        billId: bill.id,
        claimId,
        verifier: "owner",
        approve: true,
      });
      setBill(updated);
    } catch (caughtError) {
      setVerifyError(caughtError instanceof Error ? caughtError.message : "Failed to verify payment claim");
    } finally {
      setVerifyingClaimId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading bill...</div>;
  }

  if (error || !bill || !sections || !paymentSummary) {
    return <div className="p-6 text-sm text-destructive">{error || "Bill not found."}</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/transactions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-xl font-semibold lg:text-2xl">Bill Details</h1>
        <p className="text-sm text-muted-foreground">
          {bill.tenant_name} | {bill.property_name} | {bill.current_month}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            Bill Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Status</span><span className="capitalize">{bill.status}</span></div>
          <div className="flex justify-between"><span>Bill Date</span><span>{bill.current_month}</span></div>
          <div className="flex justify-between"><span>Rent (per month)</span><span>{formatNpr(sections.rentPerMonth)}</span></div>
          <div className="flex justify-between"><span>Due</span><span>{formatNpr(sections.due)}</span></div>
          <div className="flex justify-between"><span>Penalty</span><span>{formatNpr(sections.penalty)}</span></div>
          <div className="rounded-md border px-2 py-1 text-xs">
            <div className="flex justify-between"><span>Electricity bill</span><span>{formatNpr(sections.electricity.amount)}</span></div>
            <div className="text-muted-foreground">
              Prev: {sections.electricity.previousUnit} | Current: {sections.electricity.currentUnit} | Rate: {sections.electricity.rate}
            </div>
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            <div className="flex justify-between"><span>Water bill</span><span>{formatNpr(sections.water.amount)}</span></div>
            <div className="text-muted-foreground">
              Prev: {sections.water.previousUnit} | Current: {sections.water.currentUnit} | Rate: {sections.water.rate}
            </div>
          </div>
          <div className="flex justify-between"><span>Wifi</span><span>{formatNpr(sections.wifi)}</span></div>
          <div className="rounded-md border px-2 py-1 text-xs">
            <div className="flex justify-between"><span>Others</span><span>{formatNpr(sections.othersTotal)}</span></div>
            {sections.others.length > 0 ? (
              sections.others.map((charge, index) => (
                <div key={`${bill.id}-${charge.name}-${index}`} className="flex justify-between text-muted-foreground">
                  <span>{charge.name}</span>
                  <span>{formatNpr(charge.amount)}</span>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No additional charges</div>
            )}
          </div>
          <div className="flex justify-between font-medium"><span>Total</span><span>{formatNpr(sections.total)}</span></div>
          <div className="text-xs text-muted-foreground">Created: {formatNepaliDateTimeFromAd(bill.created_at)}</div>
          <div className="text-xs text-muted-foreground">
            Paid date: {bill.paid_date ? formatNepaliDateTimeFromAd(bill.paid_date) : "Not paid yet"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Total Paid</span><span>{formatNpr(paymentSummary.totalPaid)}</span></div>
          <div className="flex justify-between font-semibold">
            <span>Remaining Amount</span>
            <span>{formatNpr(paymentSummary.remainingAmount)}</span>
          </div>
          {isTenantSide ? (
            <div className="pt-2">
              <Button onClick={() => setPayOpen(true)}>Pay</Button>
            </div>
          ) : (
            <p className="pt-2 text-xs text-muted-foreground">
              Remaining balance updates only after you verify tenant payment claims.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Payment Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentSummary.pendingClaims.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending payment claims.</p>
          ) : (
            <div className="space-y-2">
              {paymentSummary.pendingClaims.map((claim) => (
                <div key={claim.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatNpr(claim.amount)}</span>
                    <span className="capitalize">{claim.payer}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Claimed At: {formatNepaliDateTimeFromAd(claim.claimedAt)}</div>
                  {claim.remarks ? <div className="text-xs text-muted-foreground">Remarks: {claim.remarks}</div> : null}
                  {claim.proofUrl ? (
                    <div className="pt-1">
                      <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="text-xs underline">
                        View Evidence
                      </a>
                    </div>
                  ) : null}
                  {!isTenantSide ? (
                    <div className="pt-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleVerifyClaim(claim.id)}
                        disabled={verifyingClaimId === claim.id}
                      >
                        {verifyingClaimId === claim.id ? "Verifying..." : "Verify Payment"}
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2 text-xs text-muted-foreground">Waiting for owner verification.</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {verifyError ? <p className="pt-2 text-sm text-destructive">{verifyError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentSummary.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {paymentSummary.history.map((entry, index) => (
                <div key={`payment-${index}-${entry.paidAt}`} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatNpr(entry.amount)}</span>
                    <span className="capitalize">{entry.payer}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Paid At: {formatNepaliDateTimeFromAd(entry.paidAt)}</div>
                  <div className="text-xs text-muted-foreground">Remaining: {formatNpr(entry.remainingAmount)}</div>
                  {entry.remarks ? <div className="text-xs text-muted-foreground">Remarks: {entry.remarks}</div> : null}
                  {entry.proofUrl ? (
                    <div className="pt-1">
                      <a href={entry.proofUrl} target="_blank" rel="noreferrer" className="text-xs underline">
                        View Evidence
                      </a>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay</DialogTitle>
            <DialogDescription>
              Enter the amount you paid. Owner verification is required before balance updates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Amount Paid (NPR)</Label>
              <Input
                min={0}
                type="number"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                placeholder="e.g. 5000"
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Optional notes about this payment"
              />
            </div>
            <div className="space-y-2">
              <Label>Evidence (optional)</Label>
              <Input
                type="file"
                accept="application/pdf,image/*"
                onChange={(event) => handleEvidenceChange(event.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">Supported files: PDF and images only.</p>
            </div>
            {payError && <p className="text-sm text-destructive">{payError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitPaymentClaim} disabled={paying}>
              {paying ? "Saving..." : "Submit Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
