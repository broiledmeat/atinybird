using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using atinybirdDucting.Artifacts;
using ductwork.Artifacts;
using ductwork.Components;
using ductwork.Crates;
using ductwork.Executors;
using Scriban;
using Scriban.Functions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;

#nullable enable
namespace atinybirdDucting.Components;

public record GalleryComponent : SingleInComponent
{
    public Setting<string> SourceRoot = string.Empty;
    public Setting<string> SourceTemplateName = ".index.tmpl";
    public Setting<string> TargetName = "index.html";

    private readonly SemaphoreSlim _semaphore = new(1, 1);
    private readonly Dictionary<string, string> _directorySourceDirectoryToTargetDirectory = new();
    private readonly Dictionary<string, HashSet<GalleryItem>> _directoryItems = new();

    private static readonly Dictionary<string, Template> TemplateCache = new();
    private static readonly Lock TemplateCacheLock = new();

    protected override async Task ExecuteIn(IExecutor executor, ICrate crate, CancellationToken token)
    {
        if (crate.Get<ISourcePathArtifact>() is not {SourcePath: { } sourcePath} ||
            crate.Get<ITargetPathArtifact>() is not {TargetPath: { } targetPath})
        {
            return;
        }

        var sourceDirectory = Path.GetDirectoryName(sourcePath);
        var targetDirectory = Path.GetDirectoryName(targetPath);

        if (sourceDirectory == null || targetDirectory == null)
        {
            return;
        }

        await _semaphore.WaitAsync(token);

        try
        {
            if (!_directoryItems.ContainsKey(sourceDirectory))
            {
                _directoryItems[sourceDirectory] = new HashSet<GalleryItem>();
            }

            var item = _directoryItems[sourceDirectory].FirstOrDefault(x => x.SourcePath == sourcePath);

            if (item == null)
            {
                item = new GalleryItem {SourcePath = sourcePath};
                _directoryItems[sourceDirectory].Add(item);
            }

            if (crate.Get<ThumbnailArtifact>() is { } thumbnailArtifact)
            {
                item.ThumbnailPath = targetPath;
                item.ThumbnailArtifact = thumbnailArtifact;
            }
            else if (crate.Get<IContentArtifact>() is { } contentArtifact)
            {
                _directorySourceDirectoryToTargetDirectory[sourceDirectory] = targetDirectory;

                item.TargetPath = targetPath;
                item.ContentArtifact = contentArtifact;
            }
            else
            {
                _directoryItems[sourceDirectory].Remove(item);
                executor.Log.Warn($"Crate had no compatible artifact for gallery {crate}, {sourcePath}.");
            }
        }
        finally
        {
            _semaphore.Release();
        }
    }

    protected override async Task ExecuteComplete(IExecutor executor, CancellationToken token)
    {
        var generateTasks = new List<Task>();

        foreach (var (sourceDirectory, items) in _directoryItems)
        {
            if (string.IsNullOrWhiteSpace(sourceDirectory))
            {
                continue;
            }

            var template = GetTemplate(executor, sourceDirectory);

            if (template == null)
            {
                var targetDirectory =
                    _directorySourceDirectoryToTargetDirectory.GetValueOrDefault(sourceDirectory, string.Empty);
                executor.Log.Warn($"Could not find valid template \"{SourceTemplateName.Value}\" for " +
                                  $"directory {targetDirectory}");
                continue;
            }

            generateTasks.Add(GenerateGallery(sourceDirectory, template, items, token));
        }

        await Task.WhenAll(generateTasks);
    }

    private async Task GenerateGallery(
        string sourceDirectory,
        Template template,
        HashSet<GalleryItem> items,
        CancellationToken token)
    {
        var targetDirectory = _directorySourceDirectoryToTargetDirectory[sourceDirectory];
        var targetPath = Path.Combine(targetDirectory, TargetName);

        var files = await Task.WhenAll(items.Select(galleryItem => GetPathObjectFromItem(galleryItem, token)));

        var directories = _directoryItems.Keys
            .Where(other => Path.GetDirectoryName(other) == sourceDirectory)
            .Select(other =>
            {
                var directoryName = Path.GetFileName(other);
                return new PathObject(directoryName, directoryName, null, null);
            })
            .ToArray();

        var script = new BuiltinFunctions
        {
            {"current", new PathObject(Path.GetFileName(targetDirectory), string.Empty, null, null)},
            {"directories", directories},
            {"files", files}
        };

        var context = new TemplateContext(script);
        var content = await template.RenderAsync(context);

        if (content != null)
        {
            Directory.CreateDirectory(targetDirectory);
            await File.WriteAllTextAsync(targetPath, content, token);
        }
    }

    private Template? GetTemplate(IExecutor executor, string directory)
    {
        var currentDirectory = directory;

        lock (TemplateCacheLock)
        {
            string? templatePath;

            while (true)
            {
                templatePath = Path.Join(currentDirectory, SourceTemplateName);

                if (File.Exists(templatePath))
                {
                    break;
                }

                if (currentDirectory == SourceRoot)
                {
                    return null;
                }

                currentDirectory = Path.GetDirectoryName(currentDirectory);

                if (currentDirectory == null)
                {
                    return null;
                }
            }

            if (!TemplateCache.TryGetValue(templatePath, out var template))
            {
                template = Template.Parse(File.ReadAllText(templatePath));
                TemplateCache[templatePath] = template;

                if (template.HasErrors)
                {
                    var message = new StringBuilder($"Template \"{templatePath}\" contained errors: ");
                    message.AppendJoin("; ", template.Messages);
                    executor.Log.Warn(message.ToString());
                }
            }

            return !template.HasErrors ? template : null;
        }
    }

    private static async Task<PathObject?> GetPathObjectFromItem(GalleryItem item, CancellationToken token)
    {
        if (item.ContentArtifact == null)
        {
            return null;
        }

        var content = await item.ContentArtifact.GetContent(token);
        var imageInfo = await TryGetImageInfo(content, token);

        object metadata = imageInfo != null
            ? GetImageMetadata(content, imageInfo)
            : new FileMetadata(content.Length);

        var targetRoot = Path.GetDirectoryName(item.TargetPath);
        var filename = Path.GetFileName(item.TargetPath);
        string? thumbnailPath = null;

        if (targetRoot != null && !string.IsNullOrWhiteSpace(item.ThumbnailPath))
        {
            thumbnailPath = Path.GetRelativePath(targetRoot, item.ThumbnailPath);
        }
        
        return new PathObject(filename, filename, thumbnailPath, metadata);
    }

    private static async Task<ImageInfo?> TryGetImageInfo(byte[] content, CancellationToken token)
    {
        var stream = new MemoryStream(content);

        try
        {
            return await Image.IdentifyAsync(stream, token);
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static ImageMetadata GetImageMetadata(byte[] content, ImageInfo imageInfo)
    {
        var exifMetadata = new Dictionary<string, object>();

        foreach (var exifValue in imageInfo.Metadata.ExifProfile?.Values ?? Enumerable.Empty<IExifValue>())
        {
            var value = exifValue.GetValue();

            if (value == null)
            {
                continue;
            }

            var name = exifValue.Tag.ToString();

            if (exifValue.IsArray && value is IList enumerable)
            {
                value = enumerable.Cast<object>().ToArray();
            }
            else if (name.ToLower().StartsWith("datetime") && value is string strValue)
            {
                if (DateTime.TryParseExact(
                        strValue,
                        "yyyy:MM:dd HH:mm:ss",
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.AssumeLocal,
                        out var datetimeValue))
                {
                    value = datetimeValue;
                }
                else if (DateTime.TryParse(strValue, out datetimeValue))
                {
                    value = datetimeValue;
                }
            }

            exifMetadata[name] = value;
        }

        return new ImageMetadata(content.Length, imageInfo.Width, imageInfo.Height, exifMetadata);
    }

    public record PathObject(string Name, string FilePath, string? ThumbnailPath, object? Metadata);

    public record FileMetadata(long Size);

    public record ImageMetadata(long Size, long Width, long Height, Dictionary<string, object> Exif);
}