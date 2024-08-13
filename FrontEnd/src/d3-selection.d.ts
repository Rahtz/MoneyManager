declare module 'd3-scale' {
  export interface ScaleLinear<Range, Output> {
    (value: number): Output;
    domain: (domain: number[]) => this;
    range: (range: Range[]) => this;
  }

  export interface ScalePoint<Range> {
    (value: string): Range;
    domain: (domain: string[]) => this;
    range: (range: Range[]) => this;
  }

  export interface ScaleTime<Range, Output> {
    (value: Date): Output;
    domain: (domain: Date[]) => this;
    range: (range: Range[]) => this;
  }

  export interface ScaleBand<Range> {
    (value: string): Range;
    domain: (domain: string[]) => this;
    range: (range: Range[]) => this;
    padding: (padding: number) => this;
  }
}
