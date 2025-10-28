import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";

interface UserClass {
  id: string;
  class_name: string;
  professor: string | null;
  semester: string | null;
  year: number | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  university_id: string | null;
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile>({ full_name: "", email: "", university_id: "" });
  const [classes, setClasses] = useState<UserClass[]>([]);
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    class_name: "",
    professor: "",
    semester: "",
    year: new Date().getFullYear(),
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch universities
    const { data: uniData } = await supabase
      .from("universities")
      .select("id, name")
      .order("name");
    
    if (uniData) {
      setUniversities(uniData);
    }

    // Fetch classes
    fetchClasses();
  };

  const fetchClasses = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("user_classes")
      .select("*")
      .eq("user_id", session.user.id)
      .order("year", { ascending: false })
      .order("semester", { ascending: false });

    if (error) {
      console.error("Error fetching classes:", error);
    } else {
      setClasses(data || []);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        university_id: profile.university_id,
      })
      .eq("id", session.user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("user_classes").insert({
      user_id: session.user.id,
      class_name: newClass.class_name,
      professor: newClass.professor || null,
      semester: newClass.semester || null,
      year: newClass.year,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add class",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Class added successfully",
      });
      setNewClass({ class_name: "", professor: "", semester: "", year: new Date().getFullYear() });
      setIsDialogOpen(false);
      fetchClasses();
    }
  };

  const handleDeleteClass = async (classId: string) => {
    const { error } = await supabase
      .from("user_classes")
      .delete()
      .eq("id", classId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete class",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
      fetchClasses();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Profile & Classes</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Information */}
        <Card className="p-6 shadow-[var(--shadow-medium)]">
          <h2 className="text-xl font-semibold text-foreground mb-4">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ""}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Select
                value={profile.university_id || ""}
                onValueChange={(value) => setProfile({ ...profile, university_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="bg-[image:var(--gradient-primary)]">
              Update Profile
            </Button>
          </form>
        </Card>

        {/* Classes */}
        <Card className="p-6 shadow-[var(--shadow-medium)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">My Classes</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[image:var(--gradient-primary)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddClass} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="class_name">Class Name</Label>
                    <Input
                      id="class_name"
                      value={newClass.class_name}
                      onChange={(e) => setNewClass({ ...newClass, class_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professor">Professor</Label>
                    <Input
                      id="professor"
                      value={newClass.professor}
                      onChange={(e) => setNewClass({ ...newClass, professor: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select
                        value={newClass.semester}
                        onValueChange={(value) => setNewClass({ ...newClass, semester: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Spring">Spring</SelectItem>
                          <SelectItem value="Summer">Summer</SelectItem>
                          <SelectItem value="Fall">Fall</SelectItem>
                          <SelectItem value="Winter">Winter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={newClass.year}
                        onChange={(e) => setNewClass({ ...newClass, year: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-[image:var(--gradient-primary)]">
                    Add Class
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {classes.length === 0 ? (
            <p className="text-muted-foreground">No classes added yet</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((cls) => (
                <Card key={cls.id} className="p-4 border-border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{cls.class_name}</h3>
                      {cls.professor && (
                        <p className="text-sm text-muted-foreground mt-1">Prof. {cls.professor}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {cls.semester} {cls.year}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClass(cls.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
