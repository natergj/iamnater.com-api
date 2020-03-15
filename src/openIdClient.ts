import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
// well-known https://cognito-idp.us-east-2.amazonaws.com/us-east-2_SuU6q7k0J/.well-known/openid-configuration

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

const providerJwks = [
  {
    alg: "RS256",
    e: "AQAB",
    kid: "b44fqNRv9qD2RnHDBO29J6jgGva1h8oQXldP2PfsJNM=",
    kty: "RSA",
    n:
      "ksAvegL1GM5Nu3FjH9lWY2uCgU1jYrd44jffF40WOn1FSKp3_E5BAfZvb237P0RH81d7vtGl5ZVS9B_SxqioC32_WLETHcKsoY7yZl6_OHvBIdWZAHjim4Cq9tMU2PvWzMZ8fVVfV_1V4Wr0cKoF1SCuhVf3QPuhXacCnoIKE5s5aPQwta-Gr0sZ2zDp0mmP9yp4TB1N7gT1ZmOdTiVPHfb7FAg8YC8hVH4RJfxaeg1Tkt300VQKg9-AcZpCNwqmECo878HACRFcYRyv3wQPsf3JogAeFhzAoTZgEVLh3DmKhWFFE_V_6gQzHK72gQdUqDvODP8F5ZczSop1fJbQ6w",
    use: "sig",
  },
  {
    alg: "RS256",
    e: "AQAB",
    kid: "3YVDAQSEjthfQy0Hfw1j01VygIeueG3kvx5Cjc8/rJ4=",
    kty: "RSA",
    n:
      "qEv0K5qPsfTvWAMWTciHMkBR2wNb0CcMYFJU2_lBNKoH8ZodT47oBuxDto9PZ_31o9uUpk_cdAcU0hEY9tml1s4yZ1ssceRyMbo9pgSPYZ0JO50HnORM_se5kP0U9TOPfRWuWyKmRRruw6OMoia9D3k3sf78J7p5RzfW4YiVuU0lM2EEDpr1aJk6aKSWMnYOUviDHRkM7Ufsa54X6bTWdkjiI3bOIpc5Zy-74szy6syrdYPDvztLiaOs_8Ru33CpO25I2P7uLNWFd3R9uRIlOLfvwDeVenB4ZfAB5R3Sx1WRA1NFVSYWQii_IzhwTIQkKi9N1etnMSnKKX94CoK4Zw",
    use: "sig",
  },
];

class OpenIdClient {
  private validatedTokens = new Map<string, TokenData>();

  public getTokenClaims = async (token: string): Promise<TokenData> => {
    let tokenClaims = this.validatedTokens.get(token);
    if (tokenClaims) {
      return tokenClaims;
    }

    const { header } = jwt.decode(token, { complete: true });
    const jwk = providerJwks.filter(c => c.kid === header.kid)[0];
    if (!jwk) {
      throw new Error("Invalid Token: unknown signing cert");
    }
    const { iss, sub, email, name, exp } = jwt.verify(token, jwkToPem(jwk));
    tokenClaims = { iss, sub, email, name, exp };
    this.validatedTokens.set(token, tokenClaims);
    return tokenClaims;
  };
}

export default new OpenIdClient();
