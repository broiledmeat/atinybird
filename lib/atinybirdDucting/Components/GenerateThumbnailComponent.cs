using System.IO;
using System.Threading;
using System.Threading.Tasks;
using atinybirdDucting.Artifacts;
using ductwork;
using ductwork.Artifacts;
using ductwork.Components;

namespace atinybirdDucting.Components
{
    public class GenerateThumbnailComponent : SingleInSingleOutComponent<IFilePathArtifact, ThumbnailArtifact>
    {
        public string SourceRoot { get; }
        public string TargetRoot { get; }
    
        public GenerateThumbnailComponent(string sourceRoot, string targetRoot)
        {
            SourceRoot = sourceRoot;
            TargetRoot = targetRoot;
        }
        
        protected override async Task ExecuteIn(Graph graph, IFilePathArtifact value, CancellationToken token)
        {
            var relativePath = Path.GetRelativePath(SourceRoot, value.FilePath); 
            var targetPath = Path.Combine(
                TargetRoot, 
                Path.GetDirectoryName(relativePath) ?? string.Empty,
                ".thumb",
                Path.GetFileNameWithoutExtension(relativePath) + ".png");
            await graph.Push(Out, new ThumbnailArtifact(value.FilePath, targetPath));
        }
    }
}