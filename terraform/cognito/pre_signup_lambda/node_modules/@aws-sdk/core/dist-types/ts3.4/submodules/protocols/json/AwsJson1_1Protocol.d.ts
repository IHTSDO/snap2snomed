import { AwsJsonRpcProtocol } from "./AwsJsonRpcProtocol";
export declare class AwsJson1_1Protocol extends AwsJsonRpcProtocol {
  constructor({
    defaultNamespace,
    serviceTarget,
  }: {
    defaultNamespace: string;
    serviceTarget: string;
  });
  getShapeId(): string;
  protected getJsonRpcVersion(): "1.1";
  protected getDefaultContentType(): string;
}
