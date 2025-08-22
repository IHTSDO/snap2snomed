import { AwsJsonRpcProtocol } from "./AwsJsonRpcProtocol";
export declare class AwsJson1_0Protocol extends AwsJsonRpcProtocol {
  constructor({
    defaultNamespace,
    serviceTarget,
  }: {
    defaultNamespace: string;
    serviceTarget: string;
  });
  getShapeId(): string;
  protected getJsonRpcVersion(): "1.0";
  protected getDefaultContentType(): string;
}
