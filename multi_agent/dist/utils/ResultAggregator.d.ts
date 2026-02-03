import { Task } from '../types';
export interface AggregationStrategy {
    aggregate(results: Map<string, any>, tasks: Map<string, Task>): any;
}
export declare class HierarchicalAggregator implements AggregationStrategy {
    aggregate(results: Map<string, any>, tasks: Map<string, Task>): any;
    private buildHierarchy;
}
export declare class SummaryAggregator implements AggregationStrategy {
    aggregate(results: Map<string, any>, tasks: Map<string, Task>): any;
}
export declare class ResultAggregator {
    private strategy;
    constructor(strategy?: AggregationStrategy);
    setStrategy(strategy: AggregationStrategy): void;
    aggregate(results: Map<string, any>, tasks: Map<string, Task>): any;
    static mergeResults(results: any[]): any;
}
//# sourceMappingURL=ResultAggregator.d.ts.map