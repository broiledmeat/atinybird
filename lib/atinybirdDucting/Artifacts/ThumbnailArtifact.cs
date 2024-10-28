using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using ductwork.Artifacts;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Processing;

namespace atinybirdDucting.Artifacts;

public record ThumbnailArtifact(string SourcePath, IImageEncoder Encoder, Size Size) : Artifact, ISourcePathArtifact
{
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    private byte[]? _cachedContent;
    private Exception? _cachedException;
    private bool? _isValid;

    public async Task<byte[]> GetContent(CancellationToken token)
    {
        await _semaphore.WaitAsync(token);

        try
        {
            if (_cachedException != null)
            {
                throw _cachedException;
            }

            if (_cachedContent != null)
            {
                return _cachedContent;
            }

            var sourceImage = await Image.LoadAsync(SourcePath, token);
            var (width, height) = sourceImage.Width > sourceImage.Height
                ? new Size(Math.Min(sourceImage.Width, Size.Width), 0)
                : new Size(0, Math.Min(sourceImage.Height, Size.Height));

            sourceImage.Mutate(x => x.Resize(width, height, KnownResamplers.Robidoux));

            var stream = new MemoryStream();
            await sourceImage.SaveAsync(stream, Encoder, token);

            _cachedContent = stream.ToArray();
            return _cachedContent;
        }
        catch (Exception e)
        {
            _cachedException = e;
            throw;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<bool> IsSourcePathValidImage(CancellationToken token)
    {
        await _semaphore.WaitAsync(token);

        try
        {
            if (_isValid != null)
            {
                return _isValid.Value;
            }

            try
            {
                await Image.IdentifyAsync(SourcePath, token);
                _isValid = true;
            }
            catch (Exception e)
            {
                _cachedException = e;
                _isValid = false;
            }

            return _isValid.Value;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public override string ToString()
    {
        return $"{GetType().Name}({SourcePath}, {Encoder.GetType().Name}, {Size})";
    }
}