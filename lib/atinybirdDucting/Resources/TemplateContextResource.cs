using System.Collections.Generic;
using System.Linq;
using ductwork.Artifacts;
using ductwork.Resources;
using GlobExpressions;

namespace atinybirdDucting.Resources;

public class TemplateContextResource : IResource
{
    public record ContextVariable(IFilePathArtifact Artifact, string Name, object? Value);

    private readonly object _lock = new();
    private readonly HashSet<ContextVariable> _variables = new();

    public ContextVariable[] Get(string name)
    {
        return _variables.Where(item => item.Name == name).ToArray();
    }

    public ContextVariable[] Get(string name, object? value)
    {
        return _variables
            .Where(item =>
                item.Name == name &&
                item.Value?.Equals(value) == true)
            .ToArray();
    }

    public ContextVariable[] GetGlob(string name, string value)
    {
        var valueGlob = new Glob(value);
        return _variables
            .Where(item =>
                item.Name == name &&
                item.Value is string stringValue && valueGlob.IsMatch(stringValue))
            .ToArray();
    }

    public ContextVariable[] Get(IFilePathArtifact artifact)
    {
        return _variables.Where(item => item.Artifact == artifact).ToArray();
    }

    public void Set(IFilePathArtifact artifact, string name, object value)
    {
        lock (_lock)
        {
            if (!_variables.Any(item => item.Artifact == artifact && item.Name == name))
            {
                _variables.Add(new ContextVariable(artifact, name, value));
            }
        }
    }
}