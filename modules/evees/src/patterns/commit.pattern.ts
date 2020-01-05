import { injectable, inject } from 'inversify';
import { html, TemplateResult } from 'lit-element';

import { Pattern, HasRedirect, IsSecure, HasLinks, Creatable, Entity } from '@uprtcl/cortex';
import { Secured, CorePatterns } from '@uprtcl/common';
import { Lens, HasLenses } from '@uprtcl/lenses';

import { Commit, EveesTypes } from '../types';
import { Evees } from '../services/evees';

export const propertyOrder = ['creatorsIds', 'timestamp', 'message', 'parentsIds', 'dataId'];

@injectable()
export class CommitEntity implements Entity {
  constructor(
    @inject(CorePatterns.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Commit>>
  ) {}

  recognize(object: object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Commit>).hasOwnProperty(p)
      )
    );
  }

  name = 'Commit';
}

@injectable()
export class CommitLinked extends CommitEntity implements HasLinks, HasRedirect {
  links: (commit: Secured<Commit>) => Promise<string[]> = async (
    commit: Secured<Commit>
  ): Promise<string[]> => [commit.object.payload.dataId, ...commit.object.payload.parentsIds];

  getChildrenLinks: (commit: Secured<Commit>) => string[] = (commit: Secured<Commit>) =>
    [] as string[];

  replaceChildrenLinks = (commit: Secured<Commit>, newLinks: string[]): Secured<Commit> => commit;

  redirect: (commit: Secured<Commit>) => Promise<string | undefined> = async (
    commit: Secured<Commit>
  ) => commit.object.payload.dataId;
}

@injectable()
export class CommitLens extends CommitEntity implements HasLenses {
  constructor(
    @inject(CorePatterns.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Commit>>
  ) {
    super(securedPattern);
  }

  lenses: (commit: Secured<Commit>) => Lens[] = (commit: Secured<Commit>): Lens[] => {
    return [
      {
        name: 'evees:commit-history',
        type: 'version-control',
        render: (lensContent: TemplateResult) => html`
          <evees-commit-history .headId=${commit.id}>${lensContent}</evees-commit-history>
        `
      }
    ];
  };
}

@injectable()
export class CommitPattern extends CommitEntity
  implements
    Creatable<{ dataId: string; message: string; parentsIds: string[]; timestamp?: number }> {
  constructor(
    @inject(CorePatterns.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Commit>>,
    @inject(EveesTypes.Evees) protected evees: Evees
  ) {
    super(securedPattern);
  }

  recognize(object: object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Commit>).hasOwnProperty(p)
      )
    );
  }

  create = () => async (
    args:
      | {
          dataId: string;
          message: string;
          parentsIds: string[];
          timestamp?: number;
        }
      | undefined,
    providerName?: string
  ) => {
    if (!args) throw new Error('Cannot create commit without specifying its details');
    const { id } = await this.evees.createCommit(args, providerName);
    return id;
  };
}
