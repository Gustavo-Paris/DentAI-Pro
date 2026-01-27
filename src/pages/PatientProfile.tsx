import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  Pencil,
  Plus,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

interface SessionGroup {
  session_id: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
  created_at: string;
}

const PatientProfile = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (!user || !patientId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch patient
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (patientError || !patientData) {
        console.error("Error fetching patient:", patientError);
        navigate("/patients");
        return;
      }

      setPatient(patientData);
      setEditName(patientData.name);
      setEditPhone(patientData.phone || "");
      setEditEmail(patientData.email || "");
      setEditNotes(patientData.notes || "");

      // Fetch evaluations for this patient
      const { data: evaluationsData, error: evalsError } = await supabase
        .from("evaluations")
        .select("session_id, tooth, status, created_at")
        .eq("patient_id", patientId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (evalsError) {
        console.error("Error fetching evaluations:", evalsError);
        setLoading(false);
        return;
      }

      // Group by session
      const sessionMap = new Map<string, { teeth: string[]; statuses: string[]; created_at: string }>();

      (evaluationsData || []).forEach((evaluation) => {
        const sessionId = evaluation.session_id || evaluation.tooth;
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, { teeth: [], statuses: [], created_at: evaluation.created_at });
        }
        const session = sessionMap.get(sessionId)!;
        session.teeth.push(evaluation.tooth);
        session.statuses.push(evaluation.status || "draft");
      });

      const sessionsArray: SessionGroup[] = Array.from(sessionMap.entries()).map(
        ([sessionId, data]) => ({
          session_id: sessionId,
          teeth: data.teeth,
          evaluationCount: data.teeth.length,
          completedCount: data.statuses.filter((s) => s === "completed").length,
          created_at: data.created_at,
        })
      );

      // Sort by date (most recent first)
      sessionsArray.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setSessions(sessionsArray);
      setLoading(false);
    };

    fetchData();
  }, [user, patientId, navigate]);

  const handleSave = async () => {
    if (!patient) return;

    setSaving(true);

    const { error } = await supabase
      .from("patients")
      .update({
        name: editName.trim(),
        phone: editPhone.trim() || null,
        email: editEmail.trim() || null,
        notes: editNotes.trim() || null,
      })
      .eq("id", patient.id);

    setSaving(false);

    if (error) {
      console.error("Error updating patient:", error);
      toast.error("Erro ao salvar alterações");
      return;
    }

    setPatient({
      ...patient,
      name: editName.trim(),
      phone: editPhone.trim() || null,
      email: editEmail.trim() || null,
      notes: editNotes.trim() || null,
    });

    toast.success("Dados do paciente atualizados");
    setEditDialogOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate metrics
  const totalSessions = sessions.length;
  const totalCases = sessions.reduce((sum, s) => sum + s.evaluationCount, 0);
  const completedCases = sessions.reduce((sum, s) => sum + s.completedCount, 0);
  const firstVisit = sessions.length > 0 ? sessions[sessions.length - 1].created_at : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </main>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {getInitials(patient.name)}
              </div>
              <div>
                <h1 className="text-lg font-semibold">{patient.name}</h1>
                <p className="text-sm text-muted-foreground">Perfil do Paciente</p>
              </div>
            </div>
          </div>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Paciente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome do paciente"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notas clínicas</Label>
                  <Textarea
                    id="notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Alergias, preferências, observações..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !editName.trim()}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/patients">Pacientes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{patient.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Contact Info */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {patient.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.notes && (
              <div className="flex items-start gap-2 text-muted-foreground w-full mt-2 pt-2 border-t border-border">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="whitespace-pre-wrap">{patient.notes}</span>
              </div>
            )}
            {!patient.phone && !patient.email && !patient.notes && (
              <p className="text-muted-foreground">
                Nenhuma informação adicional.{" "}
                <button
                  className="text-primary hover:underline"
                  onClick={() => setEditDialogOpen(true)}
                >
                  Adicionar dados
                </button>
              </p>
            )}
          </div>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-semibold">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessões</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-semibold">{totalCases}</p>
            <p className="text-xs text-muted-foreground">Casos</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-semibold text-primary">{completedCases}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-semibold">
              {firstVisit ? format(new Date(firstVisit), "d/MMM", { locale: ptBR }) : "-"}
            </p>
            <p className="text-xs text-muted-foreground">1ª Visita</p>
          </Card>
        </div>

        {/* Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Histórico de Sessões</h2>
            <Link to={`/new-case?patient=${patientId}`}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Nova Avaliação
              </Button>
            </Link>
          </div>

          {sessions.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Nenhuma avaliação ainda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie a primeira avaliação para este paciente
              </p>
              <Link to={`/new-case?patient=${patientId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Avaliação
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const isCompleted = session.completedCount === session.evaluationCount;
                const progressPercent = (session.completedCount / session.evaluationCount) * 100;

                return (
                  <Link key={session.session_id} to={`/evaluation/${session.session_id}`}>
                    <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {format(new Date(session.created_at), "d 'de' MMMM, yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                          <Badge
                            variant={isCompleted ? "default" : "secondary"}
                            className={isCompleted ? "bg-primary" : ""}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {isCompleted ? "Concluído" : "Em progresso"}
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {session.teeth.slice(0, 4).map((tooth, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tooth}
                              </Badge>
                            ))}
                            {session.teeth.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{session.teeth.length - 4}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {session.evaluationCount}{" "}
                            {session.evaluationCount === 1 ? "dente" : "dentes"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={progressPercent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {session.completedCount}/{session.evaluationCount}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientProfile;
