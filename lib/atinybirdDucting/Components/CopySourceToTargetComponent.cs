using System.IO;
using System.Threading;
using System.Threading.Tasks;
using ductwork;
using ductwork.Artifacts;

namespace atinybirdDucting.Components
{
    public class CopySourceToTargetComponent : SingleInSingleOutComponent<string, Artifact>
    {
        public string SourceRoot { get; }
        public string TargetRoot { get; }

        public CopySourceToTargetComponent(string sourceRoot, string targetRoot)
        {
            SourceRoot = sourceRoot;
            TargetRoot = targetRoot;
        }
        
        public override async Task ExecuteIn(Graph graph, string value, CancellationToken token)
        {
            var targetPath = Path.Combine(TargetRoot, Path.GetRelativePath(SourceRoot, value));
            await graph.Push(Out, new CopyFileArtifact(value, targetPath));
        }
    }
}