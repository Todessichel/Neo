declare module 'papaparse' {
  interface ParseConfig {
    header?: boolean;
    dynamicTyping?: boolean;
    skipEmptyLines?: boolean;
    complete?: (results: ParseResult<any>) => void;
    error?: (error: ParseError) => void;
  }

  interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
    };
  }

  interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  interface Papa {
    parse<T = any>(input: string | File, config?: ParseConfig): ParseResult<T>;
  }

  const Papa: Papa;
  export default Papa;
} 