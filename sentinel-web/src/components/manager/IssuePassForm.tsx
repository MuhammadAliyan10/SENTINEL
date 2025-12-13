"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { issuePass } from "@/actions/manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  Plus,
  Ticket,
  Share2,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  sapId: z
    .string()
    .min(1, "SAP ID is required")
    .regex(/^\d+$/, "SAP ID must be numbers only"),
});

export function IssuePassForm() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{
    token: string;
    sapId: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sapId: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await issuePass(values.sapId);
      if (res.success && res.token) {
        setResult({ token: res.token, sapId: values.sapId });
        toast.success("Pass issued successfully!");
        form.reset();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `Payment Received for SAP ID ${result.sapId}.\nToken: ${result.token}\nLogin: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleShare = () => {
    if (!result) return;
    const message = `Payment Received for SAP ID ${result.sapId}.\nYour Token: *${result.token}*\n\nLogin at: ${window.location.origin}/login`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleReset = () => {
    setResult(null);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="lg"
          className="w-full h-14 text-lg shadow-lg shadow-primary/20 rounded-xl"
        >
          <Plus className="mr-2 h-6 w-6" />
          ISSUE NEW PASS
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Issue New Pass</DrawerTitle>
            <DrawerDescription>
              Enter the student's SAP ID to generate an activation token.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            {result ? (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6 text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-bold text-green-800 text-lg">
                      Payment Received
                    </h3>
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        Activation Token
                      </p>
                      <p className="text-4xl font-mono font-bold tracking-widest text-foreground">
                        {result.token}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SAP ID: {result.sapId}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleShare}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setResult(null)}
                  className="w-full"
                >
                  Issue Another Pass
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="sapId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SAP ID</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Ticket className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="e.g. 70168915"
                              className="pl-9 text-lg h-12"
                              type="number"
                              pattern="\d*"
                              inputMode="numeric"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 text-lg"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Payment"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>

          <DrawerFooter>
            {!result && (
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            )}
            {result && (
              <DrawerClose asChild>
                <Button variant="ghost" onClick={handleReset}>
                  Close
                </Button>
              </DrawerClose>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
