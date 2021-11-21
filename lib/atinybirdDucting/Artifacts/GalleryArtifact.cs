using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using ductwork.Artifacts;
using SixLabors.ImageSharp;
using Force.Crc32;
using Scriban;
using Scriban.Runtime;

#nullable enable
namespace atinybirdDucting.Artifacts
{
    public class GalleryArtifact : IFinalizingArtifact
    {
        public readonly string SourceRoot;
        public readonly HashSet<string> Directories;
        public readonly Dictionary<string, string?> Files;
        public readonly string TargetRoot;
        public readonly string TargetPath;
        private static readonly Dictionary<string, Template> TemplateCache = new();
        private static readonly object TemplateCacheLock = new();

        public string GallerySourceRoot { get; }
        public string GalleryTargetRoot { get; }
        public string GalleryTemplateName { get; }
        public string GalleryOutputName { get; }
        
        public GalleryArtifact(
            string gallerySourceRoot,
            string galleryTargetRoot,
            string galleryTemplateName,
            string galleryOutputName,
            string sourceRoot,
            HashSet<string> directories,
            Dictionary<string, string?> files)
        {
            GallerySourceRoot = gallerySourceRoot;
            GalleryTargetRoot = galleryTargetRoot;
            GalleryTemplateName = galleryTemplateName;
            GalleryOutputName = galleryOutputName;                
            SourceRoot = sourceRoot;
            Directories = directories;
            Files = files;
            TargetRoot = Path.Combine(
                GalleryTargetRoot,
                Path.GetRelativePath(GallerySourceRoot, SourceRoot));
            TargetPath = Path.Combine(TargetRoot, GalleryOutputName);

            var crc = Crc32Algorithm.Compute(Encoding.UTF8.GetBytes(SourceRoot));

            crc = files.Keys
                .Aggregate(crc, (current, path) => Crc32Algorithm.Append(current, Encoding.UTF8.GetBytes(path)));

            ContentId = crc.ToString();
        }

        public string Id => TargetPath;
        public string ContentId { get; }

        public async Task<bool> Finalize(CancellationToken token)
        {
            var template = GetTemplate();

            if (template == null)
            {
                throw new InvalidOperationException("Could not find template.");
            }

            if (template.HasErrors)
            {
                var errorMessage = new StringBuilder("Template contains errors: ");
                errorMessage.AppendJoin("; ", template.Messages);

                throw new InvalidOperationException(errorMessage.ToString());
            }

            var directoryTasks = Directories
                .Select(dir => GetPathObject(dir, null, token))
                .ToArray();
            var fileTasks = Files
                .Select(pair => GetPathObject(pair.Key, pair.Value, token))
                .ToArray();

            await Task.WhenAll(directoryTasks);
            await Task.WhenAll(fileTasks);

            var context = new TemplateContext();
            context.PushGlobal(new ScriptObject
            {
                { "current", new PathObject(TargetRoot) },
                { "directories", directoryTasks.Select(task => task.Result) },
                { "files", fileTasks.Select(task => task.Result) },
            });

            var content = await template.RenderAsync(context) ?? string.Empty;

            content += string.Join("\n", template.Messages);

            await File.WriteAllTextAsync(TargetPath, content, token);

            return await Task.FromResult(true);
        }

        private Template? GetTemplate()
        {
            var currentRoot = SourceRoot;

            lock (TemplateCacheLock)
            {
                string? templatePath = null;
                
                while (true)
                {
                    templatePath = Path.Join(currentRoot, GalleryTemplateName);

                    if (File.Exists(templatePath))
                    {
                        break;
                    }

                    currentRoot = Path.GetDirectoryName(currentRoot);

                    if (currentRoot == null)
                    {
                        return null;
                    }
                }

                if (TemplateCache.ContainsKey(templatePath))
                {
                    return TemplateCache[templatePath];
                }

                var template = Template.Parse(File.ReadAllText(templatePath));
                
                TemplateCache.Add(templatePath, template);
                
                return template;
            }
        }

        private async Task<PathObject> GetPathObject(string targetPath, string? thumbnailPath, CancellationToken token)
        {
            object? metadata = null;

            if (Directory.Exists(targetPath))
            {
                metadata = new DirectoryMetadata();
            }
            else if (File.Exists(targetPath))
            {
                var fileInfo = new FileInfo(targetPath);

                try
                {
                    var imageInfo = await Image.IdentifyAsync(targetPath, token);
                    if (imageInfo != null)
                    {
                        metadata = GetMetaDataFromImage(fileInfo, imageInfo);
                    }
                }
                catch (ArgumentOutOfRangeException)
                {
                    // Image dimensions larger than int64.
                }
                catch (UnknownImageFormatException)
                {
                }

                metadata ??= new FileMetadata
                {
                    SizeBytes = fileInfo.Length
                };
            }

            return new PathObject(
                Path.GetRelativePath(TargetRoot, targetPath),
                thumbnailPath != null ? Path.GetRelativePath(TargetRoot, thumbnailPath) : null,
                metadata);
        }

        private static ImageMetadata GetMetaDataFromImage(FileInfo fileInfo, IImageInfo imageInfo)
        {
            var metadata = new ImageMetadata
            {
                Width = imageInfo.Width,
                Height = imageInfo.Height,
                SizeBytes = fileInfo.Length,
            };

            if (imageInfo.Metadata?.ExifProfile == null)
            {
                return metadata;
            }

            foreach (var exifValue in imageInfo.Metadata.ExifProfile.Values)
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

                metadata.Exif[name] = value;
            }

            return metadata;
        }

        public class DirectoryMetadata
        {
        }

        public class FileMetadata
        {
            public long SizeBytes = 0;
        }

        public class ImageMetadata : FileMetadata
        {
            public long Width = 0;
            public long Height = 0;
            public Dictionary<string, object> Exif = new();
        }

        private record PathObject(string TargetPath, string? ThumbnailPath = null, object? Metadata = null)
        {
            public string FileName => Path.GetFileName(TargetPath);
            public string FileNameWithoutExt => Path.GetFileNameWithoutExtension(TargetPath);
        }
    }
}