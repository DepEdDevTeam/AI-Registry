import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ScrollText } from "lucide-react";

interface AuditEntry {
  id: string; // Changed from _id
  actor_id: string;
  action: string;
  target_type: string; // Changed from entity_type
  target_id: string | null; // Changed from entity_id
  before_snapshot: Record<string, any> | null; // Changed from before_data
  after_snapshot: Record<string, any> | null; // Changed from after_data
  created_at: string;
}

interface AuditLogProps {
  profiles: Record<string, string>;
}

const AuditLog = ({ profiles }: AuditLogProps) => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data) {
          setEntries(data as unknown as AuditEntry[]);
        }
      } catch (err) { 
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <ScrollText className="h-5 w-5" /> Audit Log
      </h2>
      {entries.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No audit entries yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {profiles[entry.actor_id] || entry.actor_id?.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{entry.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.target_type}
                    {entry.target_id && <span className="ml-1">({entry.target_id.slice(0, 8)}…)</span>}
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    {entry.after_snapshot && (
                      <span className="text-muted-foreground">
                        {Object.entries(entry.after_snapshot).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AuditLog;