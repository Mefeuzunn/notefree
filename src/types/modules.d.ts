declare module 'mammoth' {
  export interface ConvertResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface Options {
    arrayBuffer?: ArrayBuffer;
    buffer?: any;
    path?: string;
  }

  export function convertToHtml(input: Options, options?: any): Promise<ConvertResult>;
  export function extractRawText(input: Options): Promise<ConvertResult>;
}
