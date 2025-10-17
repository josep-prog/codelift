import { useState, useEffect } from 'react';
import { supabase, Project, ProjectSubmission, Grade } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FolderGit2, Upload, CheckCircle, Award, Users } from 'lucide-react';

type ProjectWithGrade = Project & {
  submission?: (ProjectSubmission & { grades?: Grade[] })[];
};

export const StudentProjectsTab = () => {
  const [projects, setProjects] = useState<ProjectWithGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ github_url: '', video_url: '' });
  const { profile } = useAuth();

  useEffect(() => {
    loadProjects();
  }, [profile]);

  const loadProjects = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const phaseFilter = profile.phase;

      const { data, error } = await supabase
        .from('projects')
        .select('*, submission:project_submissions(*, grades(*))')
        .or(`target_phase.eq.both,target_phase.eq.${phaseFilter}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const withSubmissions = data.map((p: any) => ({
          ...p,
          submission: p.submission?.filter((s: any) => s.student_id === profile.id),
        }));
        setProjects(withSubmissions);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('project_submissions').insert({
        project_id: selectedProject?.id,
        student_id: profile?.id,
        github_url: formData.github_url,
        video_url: formData.video_url,
      });

      if (error) throw error;

      setSelectedProject(null);
      setFormData({ github_url: '', video_url: '' });
      loadProjects();
      alert('Project submitted successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading projects...</div>;
  }

  if (selectedProject) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Submit Project</h2>
          <button
            onClick={() => setSelectedProject(null)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <h3 className="text-xl font-bold text-slate-900">{selectedProject.title}</h3>
            {selectedProject.is_collaborative && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                <Users className="w-4 h-4" />
                Collaborative
              </span>
            )}
          </div>
          <p className="text-slate-700 mb-4">{selectedProject.description}</p>
          {selectedProject.guidelines && (
            <div className="mb-4">
              <h4 className="font-semibold text-slate-900 mb-2">Guidelines:</h4>
              <p className="text-slate-600 whitespace-pre-wrap">{selectedProject.guidelines}</p>
            </div>
          )}
          {selectedProject.due_date && (
            <p className="text-sm text-slate-500">
              Due: {new Date(selectedProject.due_date).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-900 mb-2">Important Notice:</h4>
          <p className="text-sm text-yellow-800 mb-2">
            {selectedProject.is_collaborative
              ? 'Even though this is a collaborative project, each student must submit their own work individually.'
              : 'This is an individual project. Submit your own original work.'}
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
            <li>Public GitHub repository with your code</li>
            <li>YouTube video showing you coding with voice explanation</li>
            <li>Video must not exceed 5 minutes</li>
            <li>Demonstrate understanding of your implementation</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              value={formData.github_url}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/username/project-repository"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              YouTube Video URL
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
          >
            Submit Project
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">My Projects</h2>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderGit2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No projects available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const mySubmission = project.submission?.[0];
            const grade = mySubmission?.grades?.[0];

            return (
              <div
                key={project.id}
                className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                      {project.is_collaborative && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Collaborative
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.due_date && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          Due: {new Date(project.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {mySubmission && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Submitted
                        </span>
                      )}
                      {grade && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          Grade: {grade.grade}/{grade.max_grade}
                        </span>
                      )}
                    </div>
                  </div>
                  {!mySubmission && (
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition whitespace-nowrap ml-4"
                    >
                      <Upload className="w-4 h-4" />
                      Submit
                    </button>
                  )}
                </div>

                {grade?.feedback && (
                  <div className="mt-4 bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 mb-2">Feedback:</h4>
                    <p className="text-slate-700">{grade.feedback}</p>
                  </div>
                )}

                {project.is_collaborative && !mySubmission && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Each team member must submit their own individual work for grading.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
