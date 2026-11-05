type IndividualVerificationRequest = {
  accountType: "individual";
  bvn: string;
  nin: string;
};

type BusinessVerificationRequest = {
  accountType: "business";
  cacNumber: string;
  businessAddress: string;
};

export type IdentityVerificationRequest =
  | IndividualVerificationRequest
  | BusinessVerificationRequest;

export type IdentityVerificationResult =
  | { verified: true }
  | { verified: false; message: string };

const DUMMY_FAILURE_VALUE = "00000000000";

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

/**
 * Dummy KYC endpoint used by the preview.
 *
 * Replace this function with a call to the real verification backend when one
 * is available. The request and result contracts are intentionally kept small
 * so the verification screens do not need to change.
 */
export async function verifyIdentity(
  request: IdentityVerificationRequest,
): Promise<IdentityVerificationResult> {
  await wait(900);

  const shouldFail =
    request.accountType === "individual"
      ? request.bvn === DUMMY_FAILURE_VALUE ||
        request.nin === DUMMY_FAILURE_VALUE
      : request.cacNumber.replace(/\s/g, "") === DUMMY_FAILURE_VALUE;

  if (shouldFail) {
    return {
      verified: false,
      message:
        "We could not verify these details. Check the information and try again.",
    };
  }

  return { verified: true };
}
