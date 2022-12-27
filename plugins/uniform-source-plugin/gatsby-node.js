const { CanvasClient } = require("@uniformdev/canvas");
const { enhance, EnhancerBuilder } = require('@uniformdev/canvas');
const { 
  createContentfulEnhancer,
  ContentfulClientList,
  CANVAS_CONTENTFUL_PARAMETER_TYPES,
} = require('@uniformdev/canvas-contentful');
const { createClient } = require('contentful');
//const { localize } = require('@uniformdev/canvas');
const fetch = require("node-fetch");

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  environment: process.env.CONTENTFUL_BRANCH,
  accessToken: process.env.CONTENTFUL_CORPORATE_ACCESS_TOKEN,
});

const clientList = new ContentfulClientList({ client });
const contentfulEnhancer = createContentfulEnhancer({ client: clientList })

const canvasClient = new CanvasClient({
  apiKey: process.env.UNIFORM_API_KEY,
  apiHost: "https://uniform.app",
  projectId: process.env.UNIFORM_PROJECT_ID,
  fetch: fetch,
});

// function helloWorldParameterEnhancer() {
//   return '👋🌎';
// }

exports.sourceNodes = async ({
  actions,
  createContentDigest,
  createNodeId,
}) => {
  const { createNode } = actions;

  const { compositions } = await canvasClient.getCompositionList({
    skipEnhance: true,
  });

  console.log(`${compositions.length} loaded from Uniform Canvas`);

  await Promise.all(
    compositions.map(async c => {
      await enhance({
        composition: c.composition,
        enhancers: new EnhancerBuilder().parameterType(
          CANVAS_CONTENTFUL_PARAMETER_TYPES,
          contentfulEnhancer
        ),
        context: {},
      })
/*
      localize({
        composition: c.composition,
        locale: ({ locales }) => {
          console.log('locales --->', locales);
          // if (locales.includes('!!! YOUR VISITOR LOCALE !!!')) {
          //   return '!!! YOUR VISITOR LOCALE !!!';
          // }
          return 'Spanish';
        }
      });
*/
      console.log("enhanced >>>", JSON.stringify(c.composition))

      return createNode({
        ...c,
        id: createNodeId(`Composition-${c.composition._id}`),
        name: c.composition._name,
        slug: c.composition._slug,
        componentType: c.composition.type,
        slots: JSON.stringify(c.composition.slots),
        parameters: JSON.stringify(c.composition.parameters),
        internal: {
          type: "Compositions",
          contentDigest: createContentDigest(c),
        },
      })
    })
  )

  return;
};