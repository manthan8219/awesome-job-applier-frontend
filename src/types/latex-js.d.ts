/** Minimal ambient types for latex.js v0.12 (the package ships no typings). */
declare module 'latex.js' {
  export class HtmlGenerator {
    constructor(options?: { hyphenate?: boolean });
  }

  export interface LatexJSParseResult {
    domFragment(): DocumentFragment;
  }

  export function parse(
    latex: string,
    options: { generator: HtmlGenerator },
  ): LatexJSParseResult;
}