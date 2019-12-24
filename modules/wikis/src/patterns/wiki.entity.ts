import { html, TemplateResult } from 'lit-element';
import { injectable, inject } from 'inversify';

import {
  Pattern,
  Hashed,
  Hashable,
  CortexTypes,
  Entity,
  Creatable,
  HasChildren
} from '@uprtcl/cortex';
import { Mergeable, MergeStrategy, mergeStrings, mergeResult } from '@uprtcl/evees';
import { HasLenses, Lens } from '@uprtcl/lenses';

import { Wiki, WikisTypes } from '../types';
import { Wikis } from '../services/wikis';

const propertyOrder = ['title', 'type', 'pages'];

@injectable()
export class WikiEntity implements Entity {
  constructor(@inject(CortexTypes.Core.Hashed) protected hashedPattern: Pattern & Hashable<any>) {}

  recognize(object: object): boolean {
    if (!this.hashedPattern.recognize(object)) return false;

    const node = this.hashedPattern.extract(object as Hashed<any>);
    return propertyOrder.every(p => node.hasOwnProperty(p));
  }

  name = 'Wiki';
}

@injectable()
export class WikiLinks extends WikiEntity implements HasChildren, Mergeable {
  replaceChildrenLinks = (wiki: Hashed<Wiki>) => (
    childrenHashes: string[]
  ): Hashed<Wiki> => ({
    ...wiki,
    object: {
      ...wiki.object,
      pages: childrenHashes
    }
  });

  getChildrenLinks: (wiki: Hashed<Wiki>) => string[] = (wiki: Hashed<Wiki>): string[] =>
    wiki.object.pages;

  links: (wiki: Hashed<Wiki>) => Promise<string[]> = async (wiki: Hashed<Wiki>) =>
    this.getChildrenLinks(wiki);

  merge = (originalNode: Hashed<Wiki>) => async (
    modifications: Hashed<Wiki>[],
    mergeStrategy: MergeStrategy
  ): Promise<Wiki> => {
    const resultTitle = mergeStrings(
      originalNode.object.title,
      modifications.map(data => data.object.title)
    );
    const resultType = mergeResult(
      originalNode.object.type,
      modifications.map(data => data.object.type)
    );

    const mergedPages = await mergeStrategy.mergeLinks(
      originalNode.object.pages,
      modifications.map(data => data.object.pages)
    );

    return {
      pages: mergedPages,
      title: resultTitle,
      type: resultType
    };
  };
}

@injectable()
export class WikiCommon extends WikiEntity implements HasLenses {
  lenses = (wiki: Hashed<Wiki>): Lens[] => {
    return [
      {
        name: 'Wiki',
        type: 'content',
        render: (lensContent: TemplateResult) => html`
          <wiki-drawer .data=${wiki.object}>${lensContent}</wiki-drawer>
        `
      }
    ];
  };
}

@injectable()
export class WikiCreate implements Creatable<Partial<Wiki>, Wiki> {
  constructor(@inject(WikisTypes.Wikis) protected wikis: Wikis) {}

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = () => async (node?: Partial<Wiki>, upl?: string): Promise<Hashed<Wiki>> => {
    const pages = node && node.pages ? node.pages : [];
    const title = node && node.title ? node.title : '';
    const type = node && node.type ? node.type : 'Wiki';

    const newWiki = { pages, title, type };
    return this.wikis.createWiki(newWiki, upl);
  };
}
