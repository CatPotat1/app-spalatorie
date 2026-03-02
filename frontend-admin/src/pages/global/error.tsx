import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";

export default function ErrorPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const msg = searchParams.get("msg");

    const onClick = () => {
        navigate("/");
    };

    return (
        <div className="w-full h-full flex flex-col justify-center items-center gap-y-5 pb-20">
            <img
                src={"/Logo.jpg"}
                alt="Logo"
                className="w-40 pointer-events-none"
            />

            <h1 className="text-destructive">Error: {msg ?? "Unknown error"}</h1>

            <Button onClick={onClick}>Back to main page</Button>
        </div>
    );
}