import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";

interface JWK {
  kid: string;
  e: string;
  kty: string;
  alg: string;
  n: string;
  use: string;
}

interface TokenData {
  iss: string;
  sub: string;
  email: string;
  name: string;
  exp: number;
}

enum OpenIdProvider {
  GOOGLE = "google",
  MICROSOFT = "microsoft",
}

const issuerProviderLookup = new Map<string, OpenIdProvider>([
  ["accounts.google.com", OpenIdProvider.GOOGLE],
  ["login.microsoftonline.com", OpenIdProvider.MICROSOFT],
]);

const discoveryUrls = new Map<OpenIdProvider, string>([
  [OpenIdProvider.GOOGLE, "https://accounts.google.com/.well-known/openid-configuration"],
  [OpenIdProvider.MICROSOFT, "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"],
]);

const providerConfigs = new Map([
  [
    OpenIdProvider.GOOGLE,
    {
      issuer: "https://accounts.google.com",
      authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      device_authorization_endpoint: "https://oauth2.googleapis.com/device/code",
      token_endpoint: "https://oauth2.googleapis.com/token",
      userinfo_endpoint: "https://openidconnect.googleapis.com/v1/userinfo",
      revocation_endpoint: "https://oauth2.googleapis.com/revoke",
      jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
      response_types_supported: [
        "code",
        "token",
        "id_token",
        "code token",
        "code id_token",
        "token id_token",
        "code token id_token",
        "none",
      ],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "email", "profile"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
      claims_supported: [
        "aud",
        "email",
        "email_verified",
        "exp",
        "family_name",
        "given_name",
        "iat",
        "iss",
        "locale",
        "name",
        "picture",
        "sub",
      ],
      code_challenge_methods_supported: ["plain", "S256"],
      grant_types_supported: [
        "authorization_code",
        "refresh_token",
        "urn:ietf:params:oauth:grant-type:device_code",
        "urn:ietf:params:oauth:grant-type:jwt-bearer",
      ],
    },
  ],
]);

const providerJwks = new Map<OpenIdProvider, JWK[]>([
  [
    OpenIdProvider.GOOGLE,
    [
      {
        e: "AQAB",
        kty: "RSA",
        alg: "RS256",
        n:
          "yOSrFI0IS_rZjn1-RGdKt4hyn2qnptQO_mNdKC6A1hfZ8MnusrJY6dNjWdIIk5Ul_RwkzjlNuk7jz5CEtYqbMw7BMaNPDfL4SO7ASBMj7yuykptNvcMno5lvgYP_YiIADJ7tfSnXy7XAv8P40cLa0GkiXBbcIg6X43MdPQq_csmuMPB-qG1g7Pq9ybAud2BSbeqa3yYChBAGNxk6zjQXl9V7nZWfIE-gCyN1u47MFKJVHGWg5ivcm9E3l5cKWG-_CGf229h6s8IVjfRpPJTY5utTroOu1mr6q-5RDQWV1GmWrSCTdEXCtFsdMsybhi1Z4Pc7e4tmCuv6mW6-aGPjbw",
        use: "sig",
        kid: "762fa637af953590db8bb8a636bf11d4360abc98",
      },
      {
        e: "AQAB",
        kty: "RSA",
        alg: "RS256",
        n:
          "yULcoP9V6feuEjCBkZ2RDHM9WLmeLJ4VlaZopidkp4ix72SKte74r6SETRdlf0K-vtfGQMPQQj1K_Z8QvHoeb1xl_KrDZ8YRzXws93Mw92RTAr9RsXKPmUVMt8I_Ed7PzBXKiDIG9JpZ35jZIbrsFYrInEomulvXDR-QormXkNe4aGxGljumzUAm25Kqp_539llrQ4uySQ8DPc9e7Pq6S9QRO7bJe2GAupkBcPD2k7p8wpIbO_Iy5gACrReipGwZtUDLeVjo9x3kVoJT-7ktRiO8r64dyjqj85uT7Jz3SnimKx1Rb3ZBtBj2CeBwnpCx7aYjmrOMiJH9B5na7TMJ3Q",
        use: "sig",
        kid: "79c809dd1186cc228c4baf9358599530ce92b4c8",
      },
    ],
  ],
]);

class OpenIdClient {
  private validatedTokens = new Map<string, TokenData>();

  private getJwks = async (provider?: OpenIdProvider): Promise<any[]> => {
    if (!provider) {
      return [];
    }
    if (!providerJwks.get(provider)) {
      const config = await this.getConfig(provider);
      const resp = await fetch(config.jwks_uri);
      const jwksConfig = await resp.json();
      providerJwks.set(provider, jwksConfig!.keys);
    }
    return providerJwks.get(provider)!;
  };

  private async getConfig(provider) {
    const config = providerConfigs.get(provider);
    return config ? config : await this.fetchProviderConfig(provider);
  }

  private async fetchProviderConfig(provider) {
    const url = discoveryUrls.get(provider);
    if (!url) {
      throw new Error("unknown provider");
    }
    const resp = await fetch(url);
    const config = await resp.json();
    providerConfigs.set(provider, config);
    return config;
  }

  public getTokenClaims = async (token: string): Promise<TokenData> => {
    let tokenClaims = this.validatedTokens.get(token);
    if (tokenClaims) {
      return tokenClaims;
    }

    const { header, payload } = jwt.decode(token, { complete: true });
    const provider = issuerProviderLookup.get(payload.iss);
    let jwks = await this.getJwks(provider);
    if (jwks.length < 1) {
      throw new Error("Invalid Token: cannot validate");
    }
    const jwk = jwks.filter(c => c.kid === header.kid)[0];
    if (!jwk) {
      throw new Error("Invalid Token: cannot validate");
    }
    const { iss, sub, email, name, exp } = jwt.verify(token, jwkToPem(jwk));
    tokenClaims = { iss, sub, email, name, exp };
    this.validatedTokens.set(token, tokenClaims);
    return tokenClaims;
  };
}

export default new OpenIdClient();
