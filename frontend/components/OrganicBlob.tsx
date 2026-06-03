"use client";
import { motion } from "motion/react";

export function OrganicBlob({ className = "" }: { className?: string }) {
  return (
    <motion.svg viewBox="0 0 200 200" className={className}
      animate={{ rotate: 360 }}
      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
    >
      <defs>
        <linearGradient id="blobGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <motion.path
        fill="url(#blobGrad2)"
        transform="translate(100 100)"
        animate={{
          d: [
            "M45,-58C57,-50,66,-35,70,-19C73,-3,72,13,64,28C57,42,44,53,30,60C15,66,-1,68,-17,65C-33,61,-48,53,-58,39C-68,26,-71,8,-69,-7C-67,-23,-58,-38,-47,-46C-35,-54,-20,-55,-4,-50C11,-44,32,-67,45,-58Z",
            "M41,-55C53,-46,62,-32,66,-17C70,-2,69,14,64,29C58,44,47,56,33,62C19,68,3,68,-13,66C-29,65,-46,62,-58,52C-70,42,-76,26,-76,10C-77,-6,-71,-22,-62,-35C-53,-48,-40,-58,-26,-66C-13,-74,0,-80,13,-76C27,-72,29,-64,41,-55Z",
            "M45,-58C57,-50,66,-35,70,-19C73,-3,72,13,64,28C57,42,44,53,30,60C15,66,-1,68,-17,65C-33,61,-48,53,-58,39C-68,26,-71,8,-69,-7C-67,-23,-58,-38,-47,-46C-35,-54,-20,-55,-4,-50C11,-44,32,-67,45,-58Z",
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
    </motion.svg>
  );
}
