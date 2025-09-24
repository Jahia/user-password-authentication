export interface AdditionalActionProps {
  text?: string;
  /**
   * link URL or function that returns a link URL
   */
  linkURL?: string | (() => void);
  linkLabel?: string;
  inProgress?: boolean;
}
