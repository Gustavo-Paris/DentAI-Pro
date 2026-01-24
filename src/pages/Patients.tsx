import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Users, Plus, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientWithStats {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  sessionCount: number;
  caseCount: number;
  completedCount: number;
  lastVisit: string | null;
}

const Patients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchPatients = async () => {
      setLoading(true);

      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("id, name, phone, email")
        .eq("user_id", user.id)
        .order("name");

      if (patientsError) {
        console.error("Error fetching patients:", patientsError);
        setLoading(false);
        return;
      }

      // Fetch evaluations to calculate stats
      const { data: evaluationsData, error: evalsError } = await supabase
        .from("evaluations")
        .select("patient_id, session_id, status, created_at")
        .eq("user_id", user.id);

      if (evalsError) {
        console.error("Error fetching evaluations:", evalsError);
        setLoading(false);
        return;
      }

      // Calculate stats per patient
      const patientsWithStats: PatientWithStats[] = (patientsData || []).map((patient) => {
        const patientEvals = evaluationsData?.filter((e) => e.patient_id === patient.id) || [];
        const uniqueSessions = new Set(patientEvals.map((e) => e.session_id));
        const completedCount = patientEvals.filter((e) => e.status === "completed").length;
        const lastEval = patientEvals.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          sessionCount: uniqueSessions.size,
          caseCount: patientEvals.length,
          completedCount,
          lastVisit: lastEval?.created_at || null,
        };
      });

      // Sort by last visit (most recent first), then by name
      patientsWithStats.sort((a, b) => {
        if (a.lastVisit && b.lastVisit) {
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        }
        if (a.lastVisit) return -1;
        if (b.lastVisit) return 1;
        return a.name.localeCompare(b.name);
      });

      setPatients(patientsWithStats);
      setLoading(false);
    };

    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Meus Pacientes</h1>
              <p className="text-sm text-muted-foreground">{patients.length} pacientes</p>
            </div>
          </div>
          <Link to="/new-case">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova Avaliação
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && patients.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum paciente cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie uma avaliação para adicionar seu primeiro paciente
            </p>
            <Link to="/new-case">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
            </Link>
          </Card>
        )}

        {/* No Results */}
        {!loading && patients.length > 0 && filteredPatients.length === 0 && (
          <Card className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum paciente encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Tente buscar por outro nome
            </p>
          </Card>
        )}

        {/* Patients List */}
        {!loading && filteredPatients.length > 0 && (
          <div className="space-y-3">
            {filteredPatients.map((patient) => (
              <Link key={patient.id} to={`/patient/${patient.id}`}>
                <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {getInitials(patient.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{patient.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {patient.caseCount} {patient.caseCount === 1 ? "caso" : "casos"} •{" "}
                        {patient.sessionCount} {patient.sessionCount === 1 ? "sessão" : "sessões"}
                        {patient.caseCount > 0 && (
                          <span className="ml-1">
                            • {Math.round((patient.completedCount / patient.caseCount) * 100)}% concluído
                          </span>
                        )}
                      </p>
                      {patient.lastVisit && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Última visita:{" "}
                          {format(new Date(patient.lastVisit), "d 'de' MMM, yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Patients;
