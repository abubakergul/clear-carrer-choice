import Image from "next/image";

type Props = {
  name?: string | null;
  image?: string | null;
  size?: number;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function UserAvatar({ name, image, size = 36 }: Props) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "User avatar"}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  const initials = name ? getInitials(name) : "?";

  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white"
    >
      {initials}
    </div>
  );
}
