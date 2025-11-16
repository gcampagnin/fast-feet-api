import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: any;
    authorizeAdmin: any;
    authorizeCourier: any;
  }
}
