using atinybirdDucting.Artifacts;
using ductwork.Artifacts;

namespace atinybirdDucting;

public class GalleryItem
{
    public string SourcePath = string.Empty;
    public string TargetPath = string.Empty;
    public IContentArtifact? ContentArtifact;
    public string ThumbnailPath = string.Empty;
    public ThumbnailArtifact? ThumbnailArtifact;
}