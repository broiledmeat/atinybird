using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using ductwork;

#nullable enable
namespace atinybirdDucting.Components
{
    public class GlobMatchComponent : SingleInComponent<string>
    {
        public readonly OutputPlug<string> True = new();
        public readonly OutputPlug<string> False = new();

        public GlobMatchComponent(string glob)
        {
            Glob = glob;
            GlobRegex = GlobToRegex(glob);
        }

        public readonly string Glob;
        public readonly Regex GlobRegex;

        public override async Task ExecuteIn(Graph graph, string value, CancellationToken token)
        {
            await graph.Push(GlobRegex.IsMatch(value) ? True : False, value);
        }

        private static Regex GlobToRegex(string glob)
        {
            var pattern = new StringBuilder();
            for (var i = 0; i < glob.Length; i++)
            {
                var c = glob[i];

                switch (c)
                {
                    case '.':
                        pattern.Append(@"\.");
                        break;
                    case '?':
                        pattern.Append(@"[^/]");
                        break;
                    case '*':
                        if (i < glob.Length - 1 && glob[i + 1] == '*')
                        {
                            pattern.Append(@".*");
                            i += 1;
                        }
                        else
                        {
                            pattern.Append(@"[^/]*");
                        }
                        break;
                    default:
                        pattern.Append(c);
                        break;
                }
            }
            
            pattern.Append('$');

            return new Regex(pattern.ToString(), RegexOptions.IgnoreCase | RegexOptions.Singleline);
        }
    }
}