import { KeyPart } from "./types";



/**
 * custom key extractor
 */
export interface KeyExtractor {
  /**
   * extract key for target key part label
   */
  targetKeyPart: string;
  /**
   * extract key part from cds event/context
   */
  extract: (evt: any) => string;
}

export const builtInExtractors: Array<KeyExtractor> = [
  {
    targetKeyPart: "tenant",
    extract: (evt) => evt?.tenant ?? "unknown_tenant"
  },
  {
    targetKeyPart: "user_id",
    extract: (evt) => evt?.user?.id ?? "unknown_user"
  },
  {
    targetKeyPart: "remote_ip",
    extract: (evt) => evt?._?.req?.ip ?? evt?._?.req?.socket.remoteAddress ?? "unknown_ip"
  },
];

export const keyExtractorCreatorBuilder = (extensionExtractors: Array<KeyExtractor> = []) => (keyParts: Array<KeyPart>) => (evt: any) => {
  const parts = [];

  for (const extractor of [...builtInExtractors, ...extensionExtractors]) {
    if (extractor.targetKeyPart !== undefined && keyParts.includes(extractor.targetKeyPart)) {
      parts.push(extractor.extract(evt));
    }
  }

  return parts.join("/");
};
