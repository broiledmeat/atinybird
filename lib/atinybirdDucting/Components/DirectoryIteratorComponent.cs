using System.IO;
using System.Threading;
using System.Threading.Tasks;
using ductwork;

#nullable enable
namespace atinybirdDucting.Components
{
    public class DirectoryIteratorComponent : SingleOutComponent<string>
    {
        public DirectoryIteratorComponent(string path, bool isRecursive = true)
        {
            Path = path;
            IsRecursive = isRecursive;
        }

        public readonly string Path;
        public readonly bool IsRecursive;

        public override async Task Execute(Graph graph, CancellationToken token)
        {
            var options = IsRecursive ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly;

            foreach (var path in Directory.EnumerateFiles(Path, "*.*", options))
            {
                token.ThrowIfCancellationRequested();
                await graph.Push(Out, path);
            }
        }
    }
}