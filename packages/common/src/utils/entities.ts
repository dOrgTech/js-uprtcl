import { PatternRecognizer, Hashed, HasRedirect, Creatable } from '@uprtcl/cortex';
import { DiscoveryService } from '@uprtcl/multiplatform';

export async function getIsomorphisms(
  patternRecognizer: PatternRecognizer,
  entity: Hashed<any>,
  loadEntity: (id: string) => Promise<Hashed<any> | undefined>
): Promise<string[]> {
  let isomorphisms: string[] = [entity.id];

  // Recursive call to get all isomorphisms from redirected entities
  const redirectedIsomorphisms = await redirectEntity(patternRecognizer, entity, loadEntity);
  isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
  return isomorphisms;
}

async function redirectEntity(
  patternRecognizer: PatternRecognizer,
  entity: object,
  loadEntity: (id: string) => Promise<Hashed<any> | undefined>
): Promise<string[]> {
  const hasRedirects: HasRedirect<any>[] = patternRecognizer
    .recognize(entity)
    .filter(prop => !!(prop as HasRedirect<any>).redirect);

  let isomorphisms: string[] = [];

  for (const hasRedirect of hasRedirects) {
    const redirectHash = await hasRedirect.redirect(entity);

    if (redirectHash) {
      const redirectEntity = await loadEntity(redirectHash);

      if (redirectEntity) {
        const redirectedIsomorphisms = await getIsomorphisms(
          patternRecognizer,
          redirectEntity,
          loadEntity
        );

        isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
      }
    }
  }

  return isomorphisms;
}

export async function entityContent(
  entity: any,
  recognizer: PatternRecognizer,
  discovery: DiscoveryService
): Promise<any | undefined> {
  const hasRedirect = recognizer.recognize(entity).find(prop => !!prop.redirect);

  if (hasRedirect) {
    const redirectEntityId = await hasRedirect.redirect(entity);

    if (redirectEntityId) {
      const redirectedEntity: Hashed<any> | undefined = await discovery.get(redirectEntityId);
      return entityContent(redirectedEntity, recognizer, discovery);
    }
  }

  return entity;
}

/**
 * Generically create the given data and retrieve its hashed it
 *
 * @param data the data to create
 * @returns the created hashed data
 */
export const createEntity = (recognizer: PatternRecognizer) => async <T extends object>(
  data: T,
  usl?: string
): Promise<string> => {
  const creatable: Creatable<T> | undefined = recognizer
    .recognize(data)
    .find(prop => !!(prop as Creatable<T>).create);

  if (!creatable) {
    throw new Error(
      `Trying to create data ${data.toString()}, but it does not implement the Creatable pattern`
    );
  }

  return creatable.create()(data, usl);
};
