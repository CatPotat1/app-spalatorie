import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { useAuthContext } from "@/providers/auth-context";
import { useUserContext } from "@/providers/user-context";

import type { LoginReturns } from "@/types/api/auth";

const schema = z.object({
  username: z.string().nonempty(),
  password: z.string().nonempty(),
});

export default function LoginPage() {
  const { login } = useAuthContext();
  const { updateUser } = useUserContext();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      username: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true);
    const result = await login(values as LoginReturns);
    setLoading(false);

    if (result.type === "error") {
      toast.error("Authentication failed", {
        description: result.msg,
      });
      return;
    }

    const { user } = result.payload;

    updateUser(user);
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 h-full w-full px-10">
      <Card className="w-full sm:w-[425px] bg-card pb-6">
        <CardHeader className="flex justify-center mb-8">
           <img
                src={"/Logo.jpg"}
                alt="Logo"
                className="h-16 pointer-events-none"
            />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="input-no-autofill"
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          className="input-no-autofill pr-10"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="flex mx-auto w-full bg-accent hover:bg-accent-hover text-accent-foreground"
                disabled={loading}
              >
                {loading ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? "Logging in..." : "Log in"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
