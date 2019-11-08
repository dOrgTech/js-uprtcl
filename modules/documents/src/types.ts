import { Node } from '@uprtcl/lenses';

export enum TextType {
  Title = 'Title',
  Paragraph = 'Paragraph'
}

export interface TypedText {
  text: string;
  type: TextType;
}

export type TextNode = TypedText & Node;

export const DocumentsTypes = {
  Module: Symbol('documents-module'),
  DocumentsProvider: Symbol('documents-provider'),
  DocumentsCache: Symbol('documents-cache'),
  TextNodePattern: Symbol('text-node-pattern')
};
