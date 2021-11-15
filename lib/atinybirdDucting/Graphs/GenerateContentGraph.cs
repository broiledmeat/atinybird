using System;
using atinybirdDucting.Components;
using ductwork;
using ductwork.Components;

namespace atinybirdDucting.Graphs
{
    public class GenerateContentGraph : Graph
    {
        public GenerateContentGraph()
        {
            // var copySourceToTargetConfig = new CopySourceToTargetConfig(Config.SourceRoot, Config.TargetRoot);
            // var galleryConfig = new GalleryConfig(Config.SourceRoot, Config.TargetRoot, ".index.tmpl", "index.html");
            //
            // var pathIterator = new DirectoryIteratorComponent(Config.SourceRoot);
            // var pathMatch = new GlobMatchComponent(new[]
            // {
            //     new Tuple<string, object>(@"**/.*", "hidden"),
            //     new Tuple<string, object>(@"/nest/**", "nest"),
            //     new Tuple<string, object>(@"*.html", "template"),
            //     new Tuple<string, object>(@"*", "copy"),
            // });
            // var fileCopy = new CopySourceToTargetComponent(copySourceToTargetConfig);
            // var finalizer = new FinalizeArtifactsComponent();
            //
            // finalizer.ArtifactFinalized += FinalizerOnArtifactFinalized;
            //
            // Add(pathIterator, pathMatch, fileCopy, finalizer);
            //
            // Connect(pathIterator.Out, pathMatch.In);
            //
            // Connect(pathMatch.Out, "copy", fileCopy.In);
            // Connect(fileCopy.Out, finalizer.In);
            //
            // // nest
            // var nestFileCopy = new CopySourceToTargetComponent(copySourceToTargetConfig);
            // var nestThumbGen = new GenerateThumbnailComponent();
            // var nestFinalizer = new FinalizeArtifactsComponent();
            // var nestGallery = new GalleryComponent(galleryConfig);
            // var nestGalleryFinalizer = new FinalizeArtifactsComponent();
            //
            // nestFinalizer.ArtifactFinalized += FinalizerOnArtifactFinalized;
            // nestGalleryFinalizer.ArtifactFinalized += FinalizerOnArtifactFinalized;
            //
            // Add(nestFileCopy, nestThumbGen, nestFinalizer, nestGallery, nestGalleryFinalizer);
            //
            // Connect(pathMatch.Out, "nest", nestFileCopy.In);
            // Connect(pathMatch.Out, "nest", nestThumbGen.In);
            //
            // Connect(nestFileCopy.Out, nestFinalizer.In);
            // Connect(nestThumbGen.Out, nestFinalizer.In);
            //
            // Connect(nestFinalizer.Out, nestGallery.In);
            // Connect(nestGallery.Out, nestGalleryFinalizer.In);
        }

        private static void FinalizerOnArtifactFinalized(FinalizeArtifactsComponent sender, FinalizedResult result)
        {
            Console.WriteLine($"[{sender}] Finalized {result.Artifact}; {result.State}; {result.Exception}");
        }
    }
}