import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Coins, Plus, Minus } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  credits: number;
}

export const CreditsTab = () => {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditAmounts, setCreditAmounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, credits")
      .order("email");

    if (error) {
      toast.error(t("error"));
      console.error("Error fetching profiles:", error);
    } else if (data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const handleCreditChange = (userId: string, amount: number) => {
    setCreditAmounts(prev => ({ ...prev, [userId]: amount }));
  };

  const addCredits = async (userId: string, userEmail: string, currentCredits: number) => {
    const amount = creditAmounts[userId] || 0;
    
    if (amount <= 0) {
      toast.error(t("enterValidAmount"));
      return;
    }

    const newCredits = currentCredits + amount;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (updateError) {
      toast.error(t("error"));
      console.error("Error updating credits:", updateError);
      return;
    }

    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: amount,
        type: "admin_added",
        description: t("creditsAddedByAdmin"),
      });

    if (transactionError) {
      console.error("Error logging transaction:", transactionError);
    }

    toast.success(t("creditsAdded", { amount, email: userEmail }));
    setCreditAmounts(prev => ({ ...prev, [userId]: 0 }));
    await fetchProfiles();
  };

  const removeCredits = async (userId: string, userEmail: string, currentCredits: number) => {
    const amount = creditAmounts[userId] || 0;
    
    if (amount <= 0) {
      toast.error(t("enterValidAmount"));
      return;
    }

    if (amount > currentCredits) {
      toast.error(t("notEnoughCredits"));
      return;
    }

    const newCredits = currentCredits - amount;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (updateError) {
      toast.error(t("error"));
      console.error("Error updating credits:", updateError);
      return;
    }

    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: -amount,
        type: "admin_removed",
        description: t("creditsRemovedByAdmin"),
      });

    if (transactionError) {
      console.error("Error logging transaction:", transactionError);
    }

    toast.success(t("creditsRemoved", { amount, email: userEmail }));
    setCreditAmounts(prev => ({ ...prev, [userId]: 0 }));
    await fetchProfiles();
  };

  if (loading) {
    return <div className="text-center py-8">{t("loading")}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          <CardTitle>{t("creditsManagement")}</CardTitle>
        </div>
        <CardDescription>{t("creditsManagementDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("fullName")}</TableHead>
              <TableHead className="text-right">{t("currentCredits")}</TableHead>
              <TableHead className="text-center">{t("creditAmount")}</TableHead>
              <TableHead className="text-center">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.email}</TableCell>
                <TableCell>{profile.full_name || "-"}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Coins className="w-4 h-4" />
                    {profile.credits}
                  </span>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={creditAmounts[profile.id] || ""}
                    onChange={(e) => handleCreditChange(profile.id, parseInt(e.target.value) || 0)}
                    className="w-24 mx-auto"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => addCredits(profile.id, profile.email, profile.credits)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t("add")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeCredits(profile.id, profile.email, profile.credits)}
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      {t("remove")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
