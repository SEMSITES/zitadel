"use client";

import { Boundary } from "@/components/boundary";
import { Button } from "@/components/button";
import { Translated } from "@/components/translated";

export default function Error({ reset }: any) {
  return (
    <Boundary labels={["Login Error"]} color="red">
      <div className="space-y-4">
        <div className="text-sm text-red-500 dark:text-red-500">
          <Translated i18nKey="failedLoading" namespace="error" />
        </div>
        <div>
          <Button data-i18n-key="error.tryagain" onClick={() => reset()}>
            <Translated i18nKey="tryagain" namespace="error" />
          </Button>
        </div>
      </div>
    </Boundary>
  );
}
