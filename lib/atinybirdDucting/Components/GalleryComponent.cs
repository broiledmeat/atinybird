using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using atinybirdDucting.Artifacts;
using ductwork;
using ductwork.Artifacts;
using ductwork.Components;

#nullable enable
namespace atinybirdDucting.Components
{
    public class GalleryComponent : SingleInSingleOutComponent<FinalizedResult, GalleryArtifact>
    {
        private readonly object _lock = new();
        private readonly Dictionary<string, Dictionary<string, string>> _files = new();
        private readonly Dictionary<string, string> _thumbnails = new();
    
        public string SourceRoot { get; }
        public string TargetRoot { get; }
        public string TemplateName { get; }
        public string OutputName { get; }
    
        public GalleryComponent(string sourceRoot, string targetRoot, string templateName, string outputName)
        {
            SourceRoot = sourceRoot;
            TargetRoot = targetRoot;
            TemplateName = templateName;
            OutputName = outputName;
        }
    
        protected override Task ExecuteIn(Graph graph, FinalizedResult value, CancellationToken token)
        {
            if (value.State == FinalizedResult.FinalizedState.Failed)
            {
                return Task.CompletedTask;
            }
    
            if (value.Artifact is CopyFileArtifact copyFileArtifact)
            {
                var sourceRoot = Path.GetDirectoryName(copyFileArtifact.FilePath) ?? string.Empty;
    
                lock (_lock)
                {
                    if (!_files.ContainsKey(sourceRoot))
                    {
                        _files[sourceRoot] = new Dictionary<string, string>();
                    }
    
                    _files[sourceRoot].Add(copyFileArtifact.FilePath, copyFileArtifact.TargetFilePath);
                }
            }
            else if (value.Artifact is ThumbnailArtifact genThumbArtifact)
            {
                lock (_lock)
                {
                    _thumbnails.Add(genThumbArtifact.SourcePath, genThumbArtifact.TargetPath);
                }
            }
    
            return Task.CompletedTask;
        }
    
        protected override async Task ExecuteComplete(Graph graph, CancellationToken token)
        {
            foreach (var (sourceRoot, files) in _files)
            {
                var targetDirectories = Directory
                    .EnumerateDirectories(sourceRoot)
                    .Select(dir => Path.Combine(
                        TargetRoot,
                        Path.GetRelativePath(SourceRoot, dir)))
                    .ToHashSet();
                var targetFiles = files
                    .ToDictionary(pair => pair.Value, pair => _thumbnails.GetValueOrDefault(pair.Key));
                await graph.Push(Out, new GalleryArtifact(
                    SourceRoot,
                    TargetRoot,
                    TemplateName,
                    OutputName,
                    sourceRoot,
                    targetDirectories,
                    targetFiles));
            }
        }
    }
}